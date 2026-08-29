import React, { useState, useEffect } from 'react';
import { Home, Bed, Search, RotateCcw, MapPin, Tag } from 'lucide-react';
import type { RecommendationsParams } from '../api/recommendationsService';
import { listingService } from '../api/listingService';
import { usePriceHistogram } from '../hooks/usePriceHistogram';
import type { AccommodationListingResponse } from '../types/listing.types';
import { Select } from '../../../components/ui/Select';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { PriceRangeDropdown } from '../../../components/ui/PriceRangeDropdown';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../constants/amenityConfig';

// ── Props ──────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  /** Called when the user submits an active search. */
  onSearch: (params: RecommendationsParams | undefined) => void;
  /** Optional callback when the user resets all search fields. */
  onReset?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onReset }) => {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [rentalType, setRentalType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [catalogListings, setCatalogListings] = useState<AccommodationListingResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    listingService.search({ size: 100, page: 0 })
      .then((page) => {
        if (!cancelled && page.content) {
          setCatalogListings(page.content);
        }
      })
      .catch(() => {
        // Silently fallback if network fails
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { globalMaxPrice, globalHistogramData } = usePriceHistogram(catalogListings, { minPrice, maxPrice });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params: RecommendationsParams = {
      title: title.trim() || undefined,
      city: city.trim() || undefined,
      minPrice: minPrice,
      maxPrice: maxPrice,
      rentalType: rentalType || undefined,
      amenities: amenities.length > 0 ? amenities.join(',') : undefined,
    };

    onSearch(params);
  };

  const handleReset = () => {
    setTitle('');
    setCity('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setRentalType('');
    setAmenities([]);

    if (onReset) {
      onReset();
    } else {
      onSearch(undefined);
    }
  };

  const hasActiveFilters = Boolean(
    title ||
    city ||
    (minPrice !== undefined && minPrice > 0) ||
    (maxPrice !== undefined && maxPrice > 0) ||
    rentalType ||
    amenities.length > 0
  );

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Buscador de alojamientos"
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-md p-3.5 md:p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2.5 items-end">
        {/* Title input (3 cols on lg) */}
        <div className="flex flex-col gap-1 lg:col-span-3 min-w-0">
          <label
            htmlFor="search-title"
            className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold"
          >
            Nombre / Título
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
              <Tag size={15} />
            </span>
            <input
              id="search-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Ático céntrico…"
              className="w-full pl-8.5 pr-2.5 py-2 rounded-xl border border-outline-variant text-body-sm text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all h-[42px]"
            />
          </div>
        </div>

        {/* City input (2 cols on lg) */}
        <div className="flex flex-col gap-1 lg:col-span-2 min-w-0">
          <label
            htmlFor="search-city"
            className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold"
          >
            Ciudad
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
              <MapPin size={15} />
            </span>
            <input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Madrid, Sevilla…"
              className="w-full pl-8.5 pr-2.5 py-2 rounded-xl border border-outline-variant text-body-sm text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all h-[42px]"
            />
          </div>
        </div>

        {/* Rental Type Select (2 cols on lg) */}
        <div className="flex flex-col gap-1 lg:col-span-2 min-w-0">
          <label
            htmlFor="search-rental-type"
            className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold"
          >
            Tipo
          </label>
          <Select
            id="search-rental-type"
            value={rentalType}
            onChange={(val) => setRentalType(val)}
            options={[
              { value: '', label: 'Cualquier tipo' },
              { value: 'ENTIRE_PLACE', label: 'Completo', icon: <Home size={15} className="text-primary" /> },
              { value: 'ROOM', label: 'Habitación', icon: <Bed size={15} className="text-primary" /> },
            ]}
            placeholder="Cualquier tipo"
            className="!py-2 !h-[42px] text-body-sm"
          />
        </div>

        {/* Price Range Dropdown (2 cols on lg) */}
        <div className="flex flex-col gap-1 lg:col-span-2 min-w-0">
          <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
            Precio
          </label>
          <PriceRangeDropdown
            min={0}
            max={globalMaxPrice || 2500}
            data={globalHistogramData}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={({ min, max }) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            placeholder="Cualquier precio"
            className="!py-2 !h-[42px] text-body-sm"
          />
        </div>

        {/* Amenities MultiSelect dropdown (2 cols on lg) */}
        <div className="flex flex-col gap-1 lg:col-span-2 min-w-0">
          <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
            Comodidades
          </label>
          <MultiSelect
            value={amenities}
            onChange={setAmenities}
            options={ALL_AMENITIES.map((amenity) => {
              const { label, icon: Icon } = AMENITY_CONFIG[amenity];
              return {
                value: amenity,
                label,
                icon: <Icon size={15} />,
              };
            })}
            placeholder="Comodidades"
            className="!py-2 !h-[42px] text-body-sm"
          />
        </div>

        {/* Action button (1 col on lg / full on mobile) */}
        <div className="flex items-center gap-1.5 lg:col-span-1 min-w-0 sm:col-span-2 md:col-span-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
              className="h-[42px] w-[38px] rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:text-primary hover:border-primary transition-all flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xs"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            type="submit"
            title="Buscar alojamientos"
            aria-label="Buscar alojamientos"
            className="flex-1 h-[42px] px-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Search size={15} className="flex-shrink-0" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </form>
  );
};
