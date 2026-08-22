import React, { useState } from 'react';
import { saveRecentSearch, type RecentSearch } from '../../../utils/recentSearch';

// ── Accommodation type options ─────────────────────────────────────────────────

const ACCOMMODATION_TYPES = [
  { value: '', label: 'Cualquier tipo' },
  { value: 'ROOM', label: 'Habitación' },
  { value: 'STUDIO', label: 'Estudio' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'HOUSE', label: 'Casa' },
] as const;

// ── Props ──────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  /** Called after saving the search to localStorage so the parent can trigger a re-fetch. */
  onSearch: (params: RecentSearch) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [accommodationType, setAccommodationType] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params: RecentSearch = {
      city: city.trim() || undefined,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
      accommodationType: accommodationType || undefined,
    };

    // Persist for future anonymous recommendation fetches
    saveRecentSearch(params);

    // Notify parent to trigger a new recommendations fetch
    onSearch(params);
  };

  const handleReset = () => {
    setCity('');
    setMaxPrice('');
    setAccommodationType('');
    const empty: RecentSearch = {};
    saveRecentSearch(empty);
    onSearch(empty);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Buscador de alojamientos"
      className="w-full bg-white border border-[#dec0b7] rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] p-4 md:p-5"
    >
      <div className="flex flex-col md:flex-row gap-3">
        {/* City input */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label
            htmlFor="search-city"
            className="text-label-sm text-[#57423b] uppercase tracking-wide"
          >
            Ciudad
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8a726a]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </span>
            <input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Madrid, Barcelona…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dec0b7] text-body-md text-[#0b1c30] placeholder:text-[#8a726a] focus:outline-none focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] transition-all"
            />
          </div>
        </div>

        {/* Max price input */}
        <div className="flex flex-col gap-1 w-full md:w-40">
          <label
            htmlFor="search-max-price"
            className="text-label-sm text-[#57423b] uppercase tracking-wide"
          >
            Precio máximo
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8a726a] text-sm font-medium">
              €
            </span>
            <input
              id="search-max-price"
              type="number"
              min={0}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Sin límite"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#dec0b7] text-body-md text-[#0b1c30] placeholder:text-[#8a726a] focus:outline-none focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] transition-all"
            />
          </div>
        </div>

        {/* Accommodation type select */}
        <div className="flex flex-col gap-1 w-full md:w-48">
          <label
            htmlFor="search-accommodation-type"
            className="text-label-sm text-[#57423b] uppercase tracking-wide"
          >
            Tipo
          </label>
          <select
            id="search-accommodation-type"
            value={accommodationType}
            onChange={(e) => setAccommodationType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#dec0b7] text-body-md text-[#0b1c30] bg-white focus:outline-none focus:border-[#0b1c30] focus:ring-2 focus:ring-[#dae2fd] transition-all appearance-none cursor-pointer"
          >
            {ACCOMMODATION_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          {/* Reset */}
          {(city || maxPrice || accommodationType) && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Limpiar búsqueda"
              className="h-10 px-3 rounded-xl border border-[#dec0b7] text-[#565e74] hover:text-[#9f3c16] hover:border-[#9f3c16] transition-colors text-sm font-medium whitespace-nowrap"
            >
              Limpiar
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="h-10 px-5 bg-[#9f3c16] text-white rounded-xl text-sm font-semibold hover:bg-[#bf542c] active:scale-95 transition-all duration-150 whitespace-nowrap flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
              />
            </svg>
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
};
