import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, SlidersHorizontal, X, Home, Bed, Euro, Loader2 } from 'lucide-react';

import { useMapListings } from '../features/housing/hooks/useMapListings';
import { useMapClusters, type MapViewport } from '../features/housing/hooks/useMapClusters';
import { ClusterBadge } from '../features/housing/components/map/ClusterBadge';
import { ClusterFan } from '../features/housing/components/map/ClusterFan';
import { MarkerPin } from '../features/housing/components/map/MarkerPin';
import { MapLegend } from '../features/housing/components/map/MapLegend';
import { MainLayout } from '../layouts/MainLayout';
import type { AccommodationListingResponse, RentalType } from '../features/housing/types/listing.types';

// ── Fix Leaflet icon paths broken by bundlers ──────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Sidebar listing card ───────────────────────────────────────────────

interface ListingCardProps {
  listing: AccommodationListingResponse;
  isHighlighted: boolean;
  onClick: (listing: AccommodationListingResponse) => void;
}

const SidebarCard: React.FC<ListingCardProps> = ({ listing, isHighlighted, onClick }) => {
  const coverImage =
    listing.selectedImages?.[0]?.imageUrl ??
    listing.accommodation?.images?.[0]?.imageUrl;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);

  return (
    <article
      id={`listing-card-${listing.id}`}
      onClick={() => onClick(listing)}
      className={[
        'flex gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200',
        isHighlighted
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-sm',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <Home size={24} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 gap-1">
        <h3 className="text-label-md text-on-surface line-clamp-2 leading-snug">
          {listing.title}
        </h3>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1 truncate">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{listing.accommodation?.city}</span>
        </p>
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-label-sm text-primary font-semibold flex items-center gap-0.5">
            <Euro size={12} />
            {formattedPrice.replace('€', '').trim()}/mes
          </span>
          <span className="text-label-sm text-on-surface-variant flex items-center gap-0.5">
            {listing.rentalType === 'ENTIRE_PLACE' ? (
              <><Home size={11} /> Completo</>
            ) : (
              <><Bed size={11} /> Habitación</>
            )}
          </span>
        </div>
      </div>
    </article>
  );
};

// ── Filter panel ────────────────────────────────────────────────────────

interface FilterValues {
  city: string;
  maxPrice: string;
  rentalType: '' | RentalType;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (f: FilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
}) => {
  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-outline-variant text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all';

  return (
    <div className="absolute top-14 left-4 z-[1000] w-72 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-headline-sm text-on-surface">Filtros</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar filtros"
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide">
          Ciudad
        </label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          placeholder="Madrid, Barcelona…"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide">
          Precio máximo (€/mes)
        </label>
        <input
          type="number"
          min={0}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
          placeholder="Sin límite"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide">
          Tipo de alquiler
        </label>
        <select
          value={filters.rentalType}
          onChange={(e) =>
            onChange({ ...filters, rentalType: e.target.value as FilterValues['rentalType'] })
          }
          className={`${inputClass} cursor-pointer appearance-none`}
        >
          <option value="">Cualquier tipo</option>
          <option value="ENTIRE_PLACE">Alojamiento completo</option>
          <option value="ROOM">Habitación</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-label-md hover:border-outline transition-colors"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-label-md hover:opacity-90 active:scale-95 transition-all"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────

/** Extracts and clamps the current viewport from a Leaflet map instance within valid WGS-84 bounds. */
const getViewport = (map: L.Map): MapViewport => {
  const b = map.getBounds();
  return {
    bounds: [
      Math.max(-180, b.getWest()),
      Math.max(-85.051129, b.getSouth()),
      Math.min(180, b.getEast()),
      Math.min(85.051129, b.getNorth()),
    ],
    zoom: map.getZoom(),
  };
};

// ── Main Page ──────────────────────────────────────────────────────────

/**
 * MapSearchPage — 3-state cluster machine.
 *
 * Rendering states (delegated to `useMapClusters`):
 *
 *   STATE 1 — MacroCluster:  Several listings near each other at current zoom.
 *             Component: <ClusterBadge count={n} />
 *             Click: fly the map to `expansionZoom` over the cluster centre.
 *
 *   STATE 2 — ExactFan:      2+ listings at identical lat/lng.
 *             Component: <ClusterFan listings={[…]} />
 *             Click: individual pin click → highlight + pan.
 *
 *   STATE 3 — SingleLeaf:    One isolated listing.
 *             Component: <MarkerPin listing={l} angle={0} />
 *             Click: highlight + pan.
 *
 * Architecture (SOLID):
 * - `useMapListings`   → data fetching (SRP)
 * - `useMapClusters`   → all supercluster logic (SRP)
 * - `ClusterBadge`     → purely visual badge (SRP)
 * - `ClusterFan`       → fan layout (SRP)
 * - `MarkerPin`        → single teardrop pin (SRP)
 * - `MapSearchPage`    → orchestration only (no business logic)
 */
export const MapSearchPage: React.FC = () => {
  const { listings, isLoading, error, search } = useMapListings();

  // ── Viewport state (drives cluster computation) ────────────────────
  const [viewport, setViewport] = useState<MapViewport>({
    bounds: [-18, 27, 5, 44], // Initial: Iberian Peninsula
    zoom: 6,
  });

  // ── Map refs ───────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersMapRef = useRef<Map<string, { marker: L.Marker; root: Root }>>(new Map());
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  // ── UI state ───────────────────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCoordinate, setExpandedCoordinate] = useState<string | null>(null);
  const [filteredListings, setFilteredListings] = useState<AccommodationListingResponse[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    city: '',
    maxPrice: '',
    rentalType: '',
  });

  // ── Cluster computation (pure, memoised) ──────────────────────────
  const clusterItems = useMapClusters(listings, viewport);

  // ── Initialise Leaflet map once ────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Hard Mercator world boundaries to prevent wrapping / multiple worlds
    const worldBounds: L.LatLngBoundsExpression = [
      [-85.051129, -180],
      [85.051129, 180],
    ];

    const map = L.map(mapContainerRef.current, {
      center: [40.4168, -3.7038],
      zoom: 6,
      minZoom: 3, // Prevents zooming out into repeated global views
      maxBounds: worldBounds, // Restricts panning and zooming within the single world map
      maxBoundsViscosity: 1.0, // 100% rigid containment at boundaries
      worldCopyJump: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 8, // Smooth animations across multiple zoom levels
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 120,
    });

    // CartoDB Positron: clean, light base map styled via CSS filters to match the brand
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      minZoom: 3,
      maxZoom: 20,
      noWrap: true, // Guarantees that tiles never replicate horizontally
      bounds: worldBounds,
      keepBuffer: 8, // Keeps extra tile layers in memory to eliminate grey flash on zoom/pan
      updateWhenZooming: false, // Prevents DOM/network overload during zoom animations
      updateWhenIdle: true, // Performs tile requests only after movement settles
    }).addTo(map);

    // Update viewport state whenever the user pans or zooms.
    // `moveend` fires after both pan AND zoom animations complete —
    // a single handler is sufficient and avoids triggering twice.
    const onMoveEnd = () => setViewport(getViewport(map));
    map.on('moveend', onMoveEnd);

    // Click anywhere on the map background to collapse expanded fans and reset sidebar filters
    const onMapClick = () => {
      setExpandedCoordinate(null);
      setFilteredListings(null);
      setHighlightedId(null);
    };
    map.on('click', onMapClick);

    mapRef.current = map;

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('click', onMapClick);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Handle listing click ───────────────────────────────────────────
  const handleListingClick = useCallback((listing: AccommodationListingResponse) => {
    setHighlightedId(listing.id);

    // Filter sidebar to show only listings belonging to the same accommodation (Option 2 / Room co-living)
    const sameLocationListings = listings.filter(
      (l) => l.accommodation.id === listing.accommodation.id
    );
    setFilteredListings(sameLocationListings);

    if (mapRef.current) {
      mapRef.current.setView(
        [listing.accommodation.latitude, listing.accommodation.longitude],
        16,
        { animate: true }
      );
    }

    // Reset sidebar scroll to the top so the clicked location listings start at the very top
    if (sidebarContainerRef.current) {
      sidebarContainerRef.current.scrollTop = 0;
    }
  }, [listings]);

  // ── Handle group pin click (Estado 2 collapsed → expand) ──────────
  const handleGroupPinClick = useCallback((listingsInGroup: AccommodationListingResponse[], coordKey: string) => {
    setExpandedCoordinate(coordKey);
    setFilteredListings(listingsInGroup);

    if (mapRef.current && listingsInGroup.length > 0) {
      const first = listingsInGroup[0];
      mapRef.current.setView(
        [first.accommodation.latitude, first.accommodation.longitude],
        16,
        { animate: true }
      );
    }

    // Reset sidebar scroll to the top so the clicked location listings start at the very top
    if (sidebarContainerRef.current) {
      sidebarContainerRef.current.scrollTop = 0;
    }
  }, []);

  // ── Handle macro-cluster click (Estado 1 → zoom in) ───────────────
  const handleClusterClick = useCallback((lat: number, lng: number, expansionZoom: number) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([lat, lng], expansionZoom, { animate: true, duration: 0.6 });
  }, []);

  // ── Reconcile markers whenever clusterItems changes ────────────────
  // High-performance diffing: Reuses existing React roots and Leaflet markers
  // instead of destroying and recreating DOM nodes and roots on every zoom step.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markersMap = markersMapRef.current;
    const activeKeys = new Set<string>();

    clusterItems.forEach((item) => {
      const key =
        item.type === 'cluster'
          ? `cluster-${item.clusterId}`
          : item.type === 'fan'
          ? `fan-${item.lat.toFixed(6)},${item.lng.toFixed(6)}`
          : `leaf-${item.listing.id}`;

      activeKeys.add(key);

      let iconAnchor: [number, number] = [20, 48]; // default teardrop tip
      let content: React.ReactNode = null;

      switch (item.type) {
        case 'cluster':
          iconAnchor = [20, 20];
          content = (
            <ClusterBadge
              count={item.count}
              onClick={() => handleClusterClick(item.lat, item.lng, item.expansionZoom)}
            />
          );
          break;

        case 'fan': {
          const coordKey = `${item.lat},${item.lng}`;
          const isExpanded = expandedCoordinate === coordKey;
          content = (
            <ClusterFan
              listings={item.listings}
              isExpanded={isExpanded}
              selectedListingId={highlightedId}
              onExpand={() => handleGroupPinClick(item.listings, coordKey)}
              onListingClick={handleListingClick}
            />
          );
          break;
        }

        case 'leaf':
          content = (
            <MarkerPin
              listing={item.listing}
              angle={0}
              isSelected={highlightedId === item.listing.id}
              onClick={handleListingClick}
            />
          );
          break;
      }

      const existing = markersMap.get(key);

      if (existing) {
        // Reuse existing marker and root (fast VDOM update, no DOM reconstruction)
        existing.marker.setLatLng([item.lat, item.lng]);
        existing.root.render(content);
      } else {
        // Create new marker and root for new cluster item
        const container = document.createElement('div');
        container.style.cssText = 'position:relative; width:40px; height:40px; overflow:visible;';

        const root = createRoot(container);
        root.render(content);

        const icon = L.divIcon({
          html: container,
          className: '',
          iconSize: [40, 40],
          iconAnchor,
        });

        const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);
        markersMap.set(key, { marker, root });
      }
    });

    // Remove markers that are no longer in the visible clusters
    markersMap.forEach((entry, key) => {
      if (!activeKeys.has(key)) {
        entry.marker.remove();
        try {
          entry.root.unmount();
        } catch {
          // Ignore if already unmounted
        }
        markersMap.delete(key);
      }
    });
  }, [clusterItems, expandedCoordinate, highlightedId, handleListingClick, handleClusterClick, handleGroupPinClick]);

  // Clean up all markers and roots when MapSearchPage unmounts
  useEffect(() => {
    const markersMap = markersMapRef.current;
    return () => {
      markersMap.forEach((entry) => {
        entry.marker.remove();
        try {
          entry.root.unmount();
        } catch {
          // Ignore
        }
      });
      markersMap.clear();
    };
  }, []);

  // Ref to ensure we fit bounds exactly once per search result load
  const hasFittedBoundsRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || listings.length === 0 || hasFittedBoundsRef.current) return;

    const points = listings.map(
      (l) => [l.accommodation.latitude, l.accommodation.longitude] as [number, number],
    );
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
    hasFittedBoundsRef.current = true;
  }, [listings]);

  // ── Apply / reset filters ──────────────────────────────────────────
  const applyFilters = () => {
    setExpandedCoordinate(null); // Collapse any open groups
    setFilteredListings(null);   // Reset sidebar filters
    hasFittedBoundsRef.current = false; // Reset to allow fitting bounds on next render
    search({
      city: filters.city.trim() || undefined,
      maxPrice: filters.maxPrice !== '' ? Number(filters.maxPrice) : undefined,
      rentalType: filters.rentalType || undefined,
    });
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setExpandedCoordinate(null); // Collapse any open groups
    setFilteredListings(null);   // Reset sidebar filters
    hasFittedBoundsRef.current = false; // Reset to allow fitting bounds on next render
    setFilters({ city: '', maxPrice: '', rentalType: '' });
    search({});
    setFiltersOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">

        {/* ── Left: Map panel ────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          {/* Leaflet container — `isolate` scopes internal z-indexes */}
          <div
            ref={mapContainerRef}
            id="map-search-container"
            className="isolate w-full h-full"
          />

          {/* Filter toggle */}
          <button
            type="button"
            id="map-filter-btn"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label="Abrir filtros"
            className="absolute top-4 left-4 z-[1000] flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md text-label-md text-on-surface hover:border-outline transition-colors"
          >
            <SlidersHorizontal size={16} className="text-primary" />
            Filtros
          </button>

          {/* Zoom state legend (dev aid, subtle) */}
          <div className="absolute bottom-4 left-4 z-[1000] px-3 py-1.5 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-lg text-label-sm text-on-surface-variant shadow">
            Zoom {viewport.zoom} — {clusterItems.length} marcador{clusterItems.length !== 1 ? 'es' : ''}
          </div>

          {/* Interactive bottom-right Map Legend */}
          <MapLegend />

          {filtersOpen && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              onClose={() => setFiltersOpen(false)}
            />
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-surface/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-primary animate-spin" />
                <span className="text-label-md text-on-surface">Cargando anuncios…</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ─────────────────────────────────────── */}
        <aside className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-l border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="px-4 py-4 border-b border-outline-variant flex-shrink-0">
            <h1 className="text-headline-sm text-on-surface">Explorar en el mapa</h1>
            {!isLoading && !error && (
              <div className="text-label-sm text-on-surface-variant mt-0.5">
                {filteredListings ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Mostrando {filteredListings.length} de {listings.length} anuncios</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilteredListings(null);
                        setHighlightedId(null);
                        setExpandedCoordinate(null);
                      }}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Ver todos
                    </button>
                  </div>
                ) : (
                  <p>
                    {listings.length} anuncio{listings.length !== 1 ? 's' : ''} encontrado
                    {listings.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            ref={sidebarContainerRef}
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
          >
            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                  <X size={18} className="text-error" />
                </div>
                <p className="text-body-md text-on-surface-variant">{error}</p>
              </div>
            )}

            {!isLoading && !error && (filteredListings ?? listings).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <MapPin size={32} className="text-outline" />
                <p className="text-body-md text-on-surface-variant">
                  No se encontraron anuncios con esos filtros.
                </p>
              </div>
            )}

            {(filteredListings ?? listings).map((listing) => (
              <SidebarCard
                key={listing.id}
                listing={listing}
                isHighlighted={highlightedId === listing.id}
                onClick={handleListingClick}
              />
            ))}
          </div>
        </aside>
      </div>
    </MainLayout>
  );
};
