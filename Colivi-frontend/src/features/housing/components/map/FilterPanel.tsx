import React, { useState, useEffect } from 'react';
import { X, Home, Bed } from 'lucide-react';
import { PriceRangeFilter } from '../../../../components/ui/PriceRangeFilter';
import { Select } from '../../../../components/ui/Select';
import { MultiSelect } from '../../../../components/ui/MultiSelect';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../../constants/amenityConfig';
import type { RentalType } from '../../types/listing.types';
import type { AmenityType } from '../../types/accommodation.types';

export interface FilterValues {
  title?: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  rentalType: '' | RentalType;
  amenities: AmenityType[];
}

export interface FilterPanelProps {
  filters: FilterValues;
  maxPriceLimit: number;
  histogramData?: number[];
  onChange: (f: FilterValues) => void;
  onApply: (f?: FilterValues) => void;
  onReset: () => void;
  onClose: () => void;
}

import { useMemo, useRef } from 'react';

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters: initialFilters,
  maxPriceLimit,
  histogramData,
  onChange,
  onApply,
  onReset,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(initialFilters);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const debouncedOnChange = useMemo(() => {
    const fn = (updated: FilterValues) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(updated), 300);
    };
    fn.cancel = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    return fn;
  }, [onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleFieldChange = (updated: FilterValues) => {
    setLocalFilters(updated);
    debouncedOnChange(updated);
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
          className="flex-1 py-2 rounded-xl bg-primary-container text-on-primary-container text-label-md font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};
