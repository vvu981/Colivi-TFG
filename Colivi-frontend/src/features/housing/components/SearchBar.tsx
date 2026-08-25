import React, { useState } from 'react';
import { Home, Bed, Search, RotateCcw, MapPin } from 'lucide-react';
import { saveRecentSearch, type RecentSearch } from '../../../utils/recentSearch';
import { Select } from '../../../components/ui/Select';
import { MultiSelect } from '../../../components/ui/MultiSelect';
import { PriceRangeDropdown } from '../../../components/ui/PriceRangeDropdown';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../constants/amenityConfig';

// ── Props ──────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  /** Called after saving the search to localStorage so the parent can trigger a re-fetch. */
  onSearch: (params: RecentSearch) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [rentalType, setRentalType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params: RecentSearch = {
      city: city.trim() || undefined,
      minPrice: minPrice,
      maxPrice: maxPrice,
      rentalType: rentalType || undefined,
      amenities: amenities.length > 0 ? amenities.join(',') : undefined,
    };

    // Persist for future anonymous recommendation fetches
    saveRecentSearch(params);

    // Notify parent to trigger a new recommendations fetch
    onSearch(params);
  };

  const handleReset = () => {
    setCity('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setRentalType('');
    setAmenities([]);
    const empty: RecentSearch = {};
    saveRecentSearch(empty);
    onSearch(empty);
  };

  const hasActiveFilters = Boolean(
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
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-md p-4 md:p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
        {/* City input (4 cols) */}
        <div className="flex flex-col gap-1.5 lg:col-span-3 min-w-0">
          <label
            htmlFor="search-city"
            className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
          >
            Ciudad
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
              <MapPin size={16} />
            </span>
            <input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Madrid, Barcelona, Sevilla…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-outline-variant text-body-md text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all"
            />
          </div>
        </div>

        {/* Rental Type Select (3 cols) */}
        <div className="flex flex-col gap-1.5 lg:col-span-3 min-w-0">
          <label
            htmlFor="search-rental-type"
            className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
          >
            Tipo de alquiler
          </label>
          <Select
            id="search-rental-type"
            value={rentalType}
            onChange={(val) => setRentalType(val)}
            options={[
              { value: '', label: 'Cualquier tipo' },
              { value: 'ENTIRE_PLACE', label: 'Alojamiento completo', icon: <Home size={16} className="text-primary" /> },
              { value: 'ROOM', label: 'Habitación', icon: <Bed size={16} className="text-primary" /> },
            ]}
            placeholder="Cualquier tipo"
            className="!py-2.5"
          />
        </div>

        {/* Price Range Dropdown with Histogram (3 cols) */}
        <div className="flex flex-col gap-1.5 lg:col-span-3 min-w-0">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
            Rango de precio
          </label>
          <PriceRangeDropdown
            min={0}
            max={2500}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={({ min, max }) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            placeholder="Cualquier precio"
            className="!py-2.5"
          />
        </div>

        {/* Amenities MultiSelect dropdown (3 cols) */}
        <div className="flex flex-col gap-1.5 lg:col-span-3 min-w-0">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
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
                icon: <Icon size={16} />,
              };
            })}
            placeholder="Cualquier comodidad"
            className="!py-2.5"
          />
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-outline-variant">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Limpiar búsqueda"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:text-primary hover:border-primary transition-all text-xs font-semibold cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Limpiar filtros</span>
          </button>
        )}

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all duration-150 shadow-sm cursor-pointer"
        >
          <Search size={15} />
          <span>Buscar alojamientos</span>
        </button>
      </div>
    </form>
  );
};
