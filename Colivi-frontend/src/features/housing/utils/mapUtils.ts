import type { AccommodationListingResponse } from '../types/listing.types';

// ── Types ────────────────────────────────────────────────────────────

/** Key uniquely identifying a geographic position on the map. */
export type CoordinateKey = `${number}-${number}`;

/** A Map where each key groups all listings at the same coordinate. */
export type ListingClusterMap = Map<CoordinateKey, AccommodationListingResponse[]>;

// ── Pure function ─────────────────────────────────────────────────────

/**
 * Groups an array of listings by their exact geographic coordinates.
 *
 * Listings that share the same `latitude` and `longitude` (from their
 * nested `accommodation` object) are placed in the same cluster.
 *
 * @param listings - Flat array of listing responses from the API.
 * @returns A `Map<CoordinateKey, AccommodationListingResponse[]>` where each
 *          entry contains one or more listings sharing the same location.
 *
 * @example
 * const clusters = clusterListings(listings);
 * clusters.forEach((group, key) => {
 *   console.log(key, group.length); // e.g. "40.416-(-3.703)" → 3 listings
 * });
 */
export const clusterListings = (
  listings: AccommodationListingResponse[],
): ListingClusterMap => {
  const map: ListingClusterMap = new Map();

  for (const listing of listings) {
    const { latitude, longitude } = listing.accommodation;
    const key: CoordinateKey = `${latitude}-${longitude}`;

    const existing = map.get(key);
    if (existing) {
      existing.push(listing);
    } else {
      map.set(key, [listing]);
    }
  }

  return map;
};
