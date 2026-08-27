import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, SlidersHorizontal, X, Home, Bed, Loader2, SearchX } from 'lucide-react';

import { useMapListings } from '../features/housing/hooks/useMapListings';
import { useMapClusters, type MapViewport } from '../features/housing/hooks/useMapClusters';
import { ClusterBadge } from '../features/housing/components/map/ClusterBadge';
import { ClusterFan } from '../features/housing/components/map/ClusterFan';
import { MarkerPin } from '../features/housing/components/map/MarkerPin';
import { MapLegend } from '../features/housing/components/map/MapLegend';
import { MAP_THEME } from '../features/housing/components/map/mapTheme';
import { PriceRangeFilter } from '../components/ui/PriceRangeFilter';
import { Select } from '../components/ui/Select';
import { MultiSelect } from '../components/ui/MultiSelect';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../features/housing/constants/amenityConfig';
import { MainLayout } from '../layouts/MainLayout';
import type { AccommodationListingResponse, RentalType } from '../features/housing/types/listing.types';
import type { AmenityType } from '../features/housing/types/accommodation.types';

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
  const [imageError, setImageError] = useState(false);

  const coverImage =
    listing.selectedImages?.[0]?.imageUrl ??
    listing.accommodation?.images?.[0]?.imageUrl;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);

  const isRoom = listing.rentalType === 'ROOM';

  return (
    <article
      id={`listing-card-${listing.id}`}
      onClick={() => onClick(listing)}
      className={[
        'group relative flex gap-3 rounded-2xl border p-2.5 cursor-pointer transition-all duration-200 select-none',
        isHighlighted
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/40'
          : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-xs hover:bg-surface-container-low/40',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/40">
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 bg-surface-container">
            <Home size={24} />
          </div>
        )}

        {/* Promoted mini badge */}
        {listing.isPromoted && (
          <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
            ★
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        {/* Top: Title & Location */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors leading-snug">
            {listing.title}
          </h3>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
            <MapPin size={11} className="text-primary flex-shrink-0" />
            <span className="truncate">
              {[listing.accommodation?.city, listing.accommodation?.address].filter(Boolean).join(', ')}
            </span>
          </p>
        </div>

        {/* Middle: Rental Type Tag */}
        <div className="flex items-center gap-1.5 my-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/60">
            {isRoom ? (
              <>
                <Bed size={11} className="text-primary" />
                <span>Habitación</span>
              </>
            ) : (
              <>
                <Home size={11} className="text-primary" />
                <span>Completo</span>
              </>
            )}
          </span>
        </div>

        {/* Bottom: Price & Detail link */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-outline-variant/40 mt-auto">
          <div className="flex items-baseline gap-0.5 truncate">
            <span className="text-xs sm:text-sm font-extrabold text-on-surface">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-on-surface-variant font-normal">/mes</span>
          </div>

          <Link
            to={`/listings/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:opacity-80 transition-all flex-shrink-0 ml-1 py-0.5 px-1 rounded"
          >
            <span>Ver</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

// ── Filter panel ────────────────────────────────────────────────────────

interface FilterValues {
  title?: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  rentalType: '' | RentalType;
  amenities: AmenityType[];
}

interface FilterPanelProps {
  filters: FilterValues;
  maxPriceLimit: number;
  histogramData?: number[];
  onChange: (f: FilterValues) => void;
  onApply: (f?: FilterValues) => void;
  onReset: () => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters: initialFilters,
  maxPriceLimit,
  histogramData,
  onChange,
  onApply,
  onReset,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(initialFilters);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const handleFieldChange = (updated: FilterValues) => {
    setLocalFilters(updated);
    onChange(updated);
  };

  const inputClass =
    'w-full px-3 py-2 rounded-xl border border-outline-variant text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all';

  return (
    <div className="px-4 py-4 bg-surface-container-low border-b border-outline-variant flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-label-lg font-bold text-on-surface">Filtros de búsqueda</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar filtros"
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide font-medium">
          Nombre del anuncio
        </label>
        <input
          type="text"
          value={localFilters.title ?? ''}
          onChange={(e) => handleFieldChange({ ...localFilters, title: e.target.value })}
          placeholder="Ático céntrico, Estudio..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide font-medium">
          Ciudad
        </label>
        <input
          type="text"
          value={localFilters.city}
          onChange={(e) => handleFieldChange({ ...localFilters, city: e.target.value })}
          placeholder="Madrid, Barcelona…"
          className={inputClass}
        />
      </div>

      {/* Rango de Precios con Histograma y Dual Slider */}
      <PriceRangeFilter
        min={0}
        max={maxPriceLimit}
        step={Math.max(10, Math.round(maxPriceLimit / 50))}
        initialMin={localFilters.minPrice ?? 0}
        initialMax={localFilters.maxPrice ?? maxPriceLimit}
        data={histogramData}
        title="Rango de precios"
        subtitle="Precio mensual del alquiler"
        className="!p-0 !bg-transparent"
        onChange={({ min, max }) => {
          handleFieldChange({
            ...localFilters,
            minPrice: min > 0 ? min : undefined,
            maxPrice: max < maxPriceLimit ? max : undefined,
          });
        }}
      />

      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide font-medium">
          Tipo de alquiler
        </label>
        <Select
          value={localFilters.rentalType}
          onChange={(val) =>
            handleFieldChange({ ...localFilters, rentalType: val as FilterValues['rentalType'] })
          }
          options={[
            { value: '', label: 'Cualquier tipo' },
            { value: 'ENTIRE_PLACE', label: 'Alojamiento completo', icon: <Home size={16} className="text-primary" /> },
            { value: 'ROOM', label: 'Habitación', icon: <Bed size={16} className="text-primary" /> },
          ]}
          placeholder="Cualquier tipo"
        />
      </div>

      {/* Comodidades / Amenities Multi-select Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wide font-medium">
          Comodidades
        </label>
        <MultiSelect
          value={localFilters.amenities}
          onChange={(newAmenities) =>
            handleFieldChange({ ...localFilters, amenities: newAmenities as AmenityType[] })
          }
          options={ALL_AMENITIES.map((amenity) => {
            const { label, icon: Icon } = AMENITY_CONFIG[amenity];
            return {
              value: amenity,
              label,
              icon: <Icon size={16} />,
            };
          })}
          placeholder="Cualquier comodidad"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface-variant text-label-md font-medium hover:border-outline hover:text-on-surface transition-colors cursor-pointer"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => onApply(localFilters)}
          className="flex-1 py-2 rounded-xl bg-primary-container text-white text-label-md font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
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
  const markersMapRef = useRef<Map<string, { marker: L.Marker; root: Root; lastExpanded?: boolean; lastSelected?: boolean }>>(new Map());
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  // ── UI state ───────────────────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedCoordinate, setExpandedCoordinate] = useState<string | null>(null);
  const [filteredListings, setFilteredListings] = useState<AccommodationListingResponse[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    title: '',
    city: '',
    minPrice: undefined,
    maxPrice: undefined,
    rentalType: '',
    amenities: [],
  });

  // ── Preservar el precio máximo global y distribución del catálogo sin filtrar ──
  const [globalMaxPrice, setGlobalMaxPrice] = useState<number>(1000);
  const [globalHistogramData, setGlobalHistogramData] = useState<number[] | undefined>(undefined);

  // ── Resizable Sidebar State ──────────────────────────────────────────
  const MIN_SIDEBAR_WIDTH = 320;
  const MAX_SIDEBAR_WIDTH = 680;
  const DEFAULT_SIDEBAR_WIDTH = 384;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('colivi_map_sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
      return !isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH
        ? parsed
        : DEFAULT_SIDEBAR_WIDTH;
    } catch {
      return DEFAULT_SIDEBAR_WIDTH;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(sidebarWidth);

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const deltaX = resizeStartXRef.current - e.clientX;
    const maxAllowed = Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 300);
    const newWidth = Math.max(
      MIN_SIDEBAR_WIDTH,
      Math.min(maxAllowed, resizeStartWidthRef.current + deltaX)
    );
    setSidebarWidth(newWidth);
    mapRef.current?.invalidateSize();
  };

  const handleResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
    try {
      localStorage.setItem('colivi_map_sidebar_width', sidebarWidth.toString());
    } catch {
      // Ignore localStorage errors
    }
    mapRef.current?.invalidateSize();
  };

  useEffect(() => {
    mapRef.current?.invalidateSize();
  }, [sidebarWidth]);

  useEffect(() => {
    if (listings && listings.length > 0) {
      const prices = listings.map((l) => Number(l.pricePerMonth) || 0).filter((p) => p > 0);
      if (prices.length > 0) {
        const currentMax = Math.max(...prices);
        const roundedMax = Math.ceil(currentMax / 10) * 10;
        const isPriceFiltered = filters.minPrice !== undefined || filters.maxPrice !== undefined;

        setGlobalMaxPrice((prev) => {
          if (!isPriceFiltered) {
            return roundedMax;
          }
          return Math.max(prev, roundedMax);
        });

        if (!isPriceFiltered) {
          const numBuckets = 20;
          const maxScale = roundedMax;
          const step = maxScale / numBuckets;
          const buckets = new Array(numBuckets).fill(0);

          listings.forEach((l) => {
            const price = Number(l.pricePerMonth) || 0;
            const idx = Math.min(Math.floor(price / (step || 1)), numBuckets - 1);
            if (idx >= 0 && idx < numBuckets) {
              buckets[idx]++;
            }
          });

          setGlobalHistogramData(buckets);
        }
      }
    }
  }, [listings, filters.minPrice, filters.maxPrice]);

  const hasActiveFilters = Boolean(
    filters.city ||
    (filters.minPrice !== undefined && filters.minPrice > 0) ||
    (filters.maxPrice !== undefined && filters.maxPrice < globalMaxPrice) ||
    filters.rentalType ||
    filters.amenities.length > 0
  );

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

    // Base map configured via MAP_THEME (SOLID / Single Source of Truth)
    L.tileLayer(MAP_THEME.tiles.url, {
      attribution: MAP_THEME.tiles.attribution,
      subdomains: MAP_THEME.tiles.subdomains,
      minZoom: MAP_THEME.tiles.minZoom,
      maxZoom: MAP_THEME.tiles.maxZoom,
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
      let isExpanded = false;
      let isSelected = false;

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
          isExpanded = expandedCoordinate === coordKey;
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
          isSelected = highlightedId === item.listing.id;
          content = (
            <MarkerPin
              listing={item.listing}
              angle={0}
              isSelected={isSelected}
              onClick={handleListingClick}
            />
          );
          break;
      }

      const existing = markersMap.get(key);

      if (existing) {
        // Reuse existing marker and root (fast VDOM update, no DOM reconstruction)
        existing.marker.setLatLng([item.lat, item.lng]);
        
        // DIFFING LOCAL: Sólo renderiza si los estados visuales del pin han cambiado.
        // Esto reduce O(N) renders pesados a O(2) constantes.
        const propsChanged = 
          existing.lastExpanded !== isExpanded || 
          existing.lastSelected !== isSelected;

        if (propsChanged) {
          existing.root.render(content);
          existing.lastExpanded = isExpanded;
          existing.lastSelected = isSelected;
        }
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
        markersMap.set(key, { marker, root, lastExpanded: isExpanded, lastSelected: isSelected });
      }
    });

    // Remove markers that are no longer in the visible clusters
    markersMap.forEach((entry, key) => {
      if (!activeKeys.has(key)) {
        entry.marker.remove();
        const rootToUnmount = entry.root;
        queueMicrotask(() => {
          try {
            rootToUnmount.unmount();
          } catch {
            // Ignore if already unmounted
          }
        });
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
        const rootToUnmount = entry.root;
        queueMicrotask(() => {
          try {
            rootToUnmount.unmount();
          } catch {
            // Ignore
          }
        });
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
  const applyFilters = (appliedFilters?: FilterValues) => {
    const f = appliedFilters ?? filters;
    setExpandedCoordinate(null); // Collapse any open groups
    setFilteredListings(null);   // Reset sidebar filters
    hasFittedBoundsRef.current = false; // Reset to allow fitting bounds on next render
    search({
      title: f.title?.trim() || undefined,
      city: f.city.trim() || undefined,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      rentalType: f.rentalType || undefined,
      amenities: f.amenities.length > 0 ? f.amenities.join(',') : undefined,
    });
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setExpandedCoordinate(null); // Collapse any open groups
    setFilteredListings(null);   // Reset sidebar filters
    hasFittedBoundsRef.current = false; // Reset to allow fitting bounds on next render
    setFilters({ title: '', city: '', minPrice: undefined, maxPrice: undefined, rentalType: '', amenities: [] });
    search({});
    setFiltersOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className={`flex h-[calc(100vh-80px)] overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>

        {/* ── Left: Map panel ────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          {/* Leaflet container — `isolate` scopes internal z-indexes */}
          <div
            ref={mapContainerRef}
            id="map-search-container"
            className="isolate w-full h-full"
          />

          {/* Zoom state legend (dev aid, subtle) */}
          <div className="absolute bottom-4 left-4 z-[1000] px-3 py-1.5 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-lg text-label-sm text-on-surface-variant shadow">
            Zoom {viewport.zoom} — {clusterItems.length} marcador{clusterItems.length !== 1 ? 'es' : ''}
          </div>

          {/* Interactive bottom-right Map Legend */}
          <MapLegend />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-surface/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-primary-container animate-spin" />
                <span className="text-label-md text-on-surface">Cargando anuncios…</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Resizer Divider Handle ──────────────────────────────── */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={sidebarWidth}
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={MAX_SIDEBAR_WIDTH}
          aria-label="Ajustar ancho de la barra lateral"
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className={`relative group flex items-center justify-center w-2 -ml-1 -mr-1 z-30 cursor-col-resize select-none transition-colors ${
            isResizing ? 'bg-primary/20 cursor-col-resize' : 'hover:bg-primary/10'
          }`}
        >
          {/* Visual indicator handle pill */}
          <div
            className={`w-1 h-8 rounded-full transition-all duration-150 ${
              isResizing ? 'bg-primary scale-y-125' : 'bg-outline-variant/60 group-hover:bg-primary/80'
            }`}
          />
        </div>

        {/* ── Right: Sidebar ─────────────────────────────────────── */}
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className="flex-shrink-0 flex flex-col border-l border-outline-variant bg-surface-container-lowest overflow-hidden"
        >
          <div className="px-4 py-3.5 border-b border-outline-variant flex-shrink-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-headline-sm text-on-surface truncate">Explorar mapa</h1>
              {!isLoading && !error && (
                <div className="text-label-sm text-on-surface-variant mt-0.5">
                  {filteredListings ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{filteredListings.length} de {listings.length}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFilteredListings(null);
                          setHighlightedId(null);
                          setExpandedCoordinate(null);
                        }}
                        className="text-primary-container hover:underline font-semibold cursor-pointer text-[12px]"
                      >
                        Ver todos
                      </button>
                    </div>
                  ) : (
                    <p>
                      {listings.length} anuncio{listings.length !== 1 ? 's' : ''} encontrado{listings.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Filter Toggle Button in Sidebar */}
            <button
              type="button"
              id="sidebar-filter-btn"
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-label={filtersOpen ? 'Ocultar filtros' : 'Abrir filtros de búsqueda'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-label-sm font-medium transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0 ${
                filtersOpen || hasActiveFilters
                  ? 'bg-primary-container text-white border-primary-container'
                  : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container hover:border-outline'
              }`}
            >
              <SlidersHorizontal
                size={14}
                className={filtersOpen || hasActiveFilters ? 'text-white' : 'text-primary-container'}
              />
              <span>Filtros</span>
              {hasActiveFilters && !filtersOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>

          {/* Collapsible Filter Panel in Sidebar */}
          {filtersOpen && (
            <FilterPanel
              filters={filters}
              maxPriceLimit={globalMaxPrice}
              histogramData={globalHistogramData}
              onChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              onClose={() => setFiltersOpen(false)}
            />
          )}

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
              <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant">
                <SearchX size={48} className="mb-4 opacity-50" />
                <h3 className="text-label-lg font-bold">Sin resultados</h3>
                <p className="text-body-sm text-center">
                  No hay anuncios que coincidan con estos filtros.
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
