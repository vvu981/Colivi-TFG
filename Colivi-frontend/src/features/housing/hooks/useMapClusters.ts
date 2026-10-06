import { useMemo } from 'react';
import Supercluster, {
  type AnyProps,
  type ClusterFeature,
  type PointFeature,
} from 'supercluster';
import type { AccommodationListingResponse } from '../types/listing.types';

// ── Constants ─────────────────────────────────────────────────────────

/**
 * Zoom level at which supercluster stops aggregating points.
 * Above this level every point is treated as an individual leaf.
 */
const SUPERCLUSTER_MAX_ZOOM = 17;

/** Pixel radius used by supercluster to decide if two points should merge. */
const SUPERCLUSTER_RADIUS = 60;

// ── Discriminated union — the 3 rendering states ──────────────────────

/**
 * ESTADO 1: Multiple listings nearby, but NOT at the same exact coordinate.
 * → Render: `<ClusterBadge count={count} />`
 */
export interface MacroCluster {
  type: 'cluster';
  /** Unique supercluster cluster ID (positive integer). */
  clusterId: number;
  lat: number;
  lng: number;
  count: number;
  /** Zoom level that fully expands this cluster. Fly to this zoom on click. */
  expansionZoom: number;
}

/**
 * ESTADO 2: 2+ listings at EXACTLY the same lat/lng coordinate.
 * → Render: `<ClusterFan listings={listings} />`
 */
export interface ExactFan {
  type: 'fan';
  lat: number;
  lng: number;
  listings: AccommodationListingResponse[];
}

/**
 * ESTADO 3: A single, isolated listing with no duplicates at its coordinate.
 * → Render: `<MarkerPin listing={listing} angle={0} />`
 */
export interface SingleLeaf {
  type: 'leaf';
  lat: number;
  lng: number;
  listing: AccommodationListingResponse;
}

export type MapClusterItem = MacroCluster | ExactFan | SingleLeaf;

// ── GeoJSON point property type (carried through supercluster) ─────────

interface ListingProperties {
  listing: AccommodationListingResponse;
}

/**
 * Type predicate that narrows a supercluster feature to `ClusterFeature`.
 *
 * `getClusters()` signature (from @types/supercluster):
 *   Supercluster<P, C = AnyProps>.getClusters() → ClusterFeature<C> | PointFeature<P>
 *
 * Cluster features always use the `C` generic (defaults to `AnyProps`),
 * independent of the point generic `P = ListingProperties`.
 * Therefore the predicate must accept `ClusterFeature<AnyProps>`, not
 * `ClusterFeature<ListingProperties>`.
 */
function isClusterFeature(
  feature: ClusterFeature<AnyProps> | PointFeature<ListingProperties>,
): feature is ClusterFeature<AnyProps> {
  return 'cluster' in feature.properties && Boolean(feature.properties.cluster);
}

// ── Hook ──────────────────────────────────────────────────────────────

export interface MapViewport {
  /** [west, south, east, north] in WGS-84 degrees. */
  bounds: [number, number, number, number];
  zoom: number;
}

/**
 * Custom hook that converts a flat array of listings into a typed,
 * zoom-aware list of `MapClusterItem` objects using supercluster.
 *
 * SRP: contains ALL clustering logic. The map component receives only
 * the resolved `MapClusterItem[]` array and renders the appropriate
 * component per type without knowing any supercluster internals.
 *
 * @param listings - All fetched listings (can be hundreds).
 * @param viewport - Current map bounds + zoom level.
 * @returns A stable, memoised array of `MapClusterItem`.
 */
export const useMapClusters = (
  listings: AccommodationListingResponse[],
  viewport: MapViewport,
): MapClusterItem[] => {
  // ── 1. Build supercluster index (memoised by listings reference) ───
  const sc = useMemo(() => {
    const index = new Supercluster<ListingProperties>({
      radius: SUPERCLUSTER_RADIUS,
      maxZoom: SUPERCLUSTER_MAX_ZOOM,
      minZoom: 0,
    });

    const points: GeoJSON.Feature<GeoJSON.Point, ListingProperties>[] =
      listings.map((listing) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [listing.accommodation.longitude, listing.accommodation.latitude],
        },
        properties: { listing },
      }));

    index.load(points);
    return index;
  }, [listings]);

  // ── 2. Query clusters for the current viewport (memoised by viewport) ─
  return useMemo((): MapClusterItem[] => {
    if (listings.length === 0) return [];

    const { bounds, zoom } = viewport;
    // Allow zoom to go beyond SUPERCLUSTER_MAX_ZOOM so supercluster decompresses leaves at high zoom.
    const clampedZoom = Math.floor(Math.max(zoom, 0));

    const rawClusters = sc.getClusters(bounds, clampedZoom);

    const items: MapClusterItem[] = [];
    const leafMap = new Map<string, ExactFan | SingleLeaf>();

    for (const feature of rawClusters) {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;

      if (isClusterFeature(feature)) {
        // ── Supercluster aggregate (ClusterFeature) ───────────────────────
        // `feature.properties` is now narrowed to `ClusterProperties & ListingProperties`
        // – cluster_id and point_count are directly accessible, no cast needed.
        const clusterId = feature.properties.cluster_id;
        const count = feature.properties.point_count;
        const expansionZoom = sc.getClusterExpansionZoom(clusterId);

        let allSameCoord = false;
        let leaves: Array<GeoJSON.Feature<GeoJSON.Point, ListingProperties>> = [];

        // Check whether ALL leaves share the exact same coordinate →
        // if so, treat this as a fan cluster rather than a macro cluster.
        // PERF: Only extract leaves if the cluster cannot be expanded anymore (expansionZoom > MAX_ZOOM)
        if (expansionZoom > SUPERCLUSTER_MAX_ZOOM) {
          leaves = sc.getLeaves(clusterId, Infinity);
          if (leaves.length > 0) {
            const firstLeaf = leaves[0];
            allSameCoord = leaves.every(
              (leaf) =>
                leaf.geometry.coordinates[0] === firstLeaf.geometry.coordinates[0] &&
                leaf.geometry.coordinates[1] === firstLeaf.geometry.coordinates[1],
            );
          }
        }

        if (allSameCoord) {
          // ESTADO 2: All leaves pile up at the exact same point
          items.push({
            type: 'fan',
            lat,
            lng,
            listings: leaves.map((l) => l.properties.listing),
          });
        } else {
          // ESTADO 1: Genuinely spread macro-cluster
          items.push({
            type: 'cluster',
            clusterId,
            lat,
            lng,
            count,
            expansionZoom: expansionZoom, // Allow expanding to individual leaves
          });
        }
      } else {
        // ── Single leaf point ────────────────────────────────────────
        const listing = (props as ListingProperties).listing;
        const coordKey = `${lat},${lng}`;

        const existing = leafMap.get(coordKey);
        
        if (existing) {
          if (existing.type === 'fan') {
            existing.listings.push(listing);
          } else {
            // Promote leaf to fan
            const newFan: ExactFan = {
              type: 'fan',
              lat,
              lng,
              listings: [existing.listing, listing]
            };
            leafMap.set(coordKey, newFan);
          }
        } else {
          // ESTADO 3: Genuinely isolated leaf
          leafMap.set(coordKey, { type: 'leaf', lat, lng, listing });
        }
      }
    }

    // Add all aggregated leaves/fans from leafMap to items
    for (const item of leafMap.values()) {
      items.push(item);
    }

    return items;
  }, [sc, viewport, listings.length]);
};
