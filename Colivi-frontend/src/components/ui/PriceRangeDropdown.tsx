import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Euro, RotateCcw } from 'lucide-react';
import { PriceRangeFilter } from './PriceRangeFilter';

export interface PriceRangeDropdownProps {
  min?: number;
  max?: number;
  minPrice?: number;
  maxPrice?: number;
  onChange: (range: { min?: number; max?: number }) => void;
  data?: number[];
  currencySymbol?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable Price Range Dropdown / Popover containing the full histogram filter.
 * Follows SOLID principles and design system tokens.
 */
export const PriceRangeDropdown: React.FC<PriceRangeDropdownProps> = ({
  min = 0,
  max = 2000,
  minPrice,
  maxPrice,
  onChange,
  data,
  currencySymbol = '€',
  placeholder = 'Cualquier precio',
  className = '',
  disabled = false,
}) => {
  const generatedId = useId();
  const selectId = generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isFiltered =
    (minPrice !== undefined && minPrice > min) ||
    (maxPrice !== undefined && maxPrice < max);

  const renderTriggerLabel = () => {
    if (!isFiltered) {
      return <span className="text-on-surface-variant/60">{placeholder}</span>;
    }

    const currentMin = minPrice ?? min;
    const currentMax = maxPrice ?? max;

    return (
      <span className="flex items-center gap-1.5 text-on-surface truncate font-semibold text-xs">
        <span>
          {currentMin} {currencySymbol} - {currentMax} {currencySymbol}
        </span>
      </span>
    );
  };

  const handlePriceChange = (range: { min: number; max: number }) => {
    onChange({
      min: range.min > min ? range.min : undefined,
      max: range.max < max ? range.max : undefined,
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ min: undefined, max: undefined });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border border-outline-variant text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-on-surface focus:ring-2 focus:ring-secondary-container transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          <Euro size={15} className="text-primary flex-shrink-0" />
          {renderTriggerLabel()}
        </div>
        <ChevronDown
          size={16}
          className={`text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-on-surface' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-labelledby={selectId}
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-80 sm:w-96 rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-4"
        >
          {/* Histogram Filter Component */}
          <PriceRangeFilter
            min={min}
            max={max}
            initialMin={minPrice ?? min}
            initialMax={maxPrice ?? max}
            data={data}
            currencySymbol={currencySymbol}
            title="Rango de precio"
            subtitle="Precios mensuales por alojamiento"
            onChange={handlePriceChange}
          />

          {/* Bottom actions */}
          <div className="flex items-center justify-between border-t border-outline-variant/60 pt-3">
            {isFiltered ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Restablecer</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceRangeDropdown;
