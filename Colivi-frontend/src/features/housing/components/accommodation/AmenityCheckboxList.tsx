import React from 'react';
import { Check } from 'lucide-react';
import type { AmenityType } from '../../types/accommodation.types';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../../constants/amenityConfig';

export interface AmenityCheckboxListProps {
  selected: AmenityType[];
  onChange: (selected: AmenityType[]) => void;
  className?: string;
}

/**
 * Checklist component for filtering listings by accommodation amenities.
 * Follows Single Responsibility Principle (SRP) and reuses centralized AMENITY_CONFIG.
 */
export const AmenityCheckboxList: React.FC<AmenityCheckboxListProps> = ({
  selected,
  onChange,
  className = '',
}) => {
  const handleToggle = (amenity: AmenityType) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter((item) => item !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Filtro de comodidades">
        {ALL_AMENITIES.map((amenity) => {
          const { label, icon: Icon } = AMENITY_CONFIG[amenity];
          const isChecked = selected.includes(amenity);

          return (
            <label
              key={amenity}
              htmlFor={`amenity-filter-${amenity.toLowerCase()}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none text-body-md ${
                isChecked
                  ? 'bg-primary/10 border-primary/50 text-primary font-medium shadow-2xs'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low hover:border-outline'
              }`}
            >
              <input
                id={`amenity-filter-${amenity.toLowerCase()}`}
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(amenity)}
                className="sr-only"
                aria-checked={isChecked}
              />
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                  isChecked
                    ? 'bg-primary border-primary text-white'
                    : 'border-outline-variant bg-surface'
                }`}
                aria-hidden="true"
              >
                {isChecked && <Check size={12} strokeWidth={3} />}
              </div>
              <Icon size={16} className={`flex-shrink-0 ${isChecked ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span className="truncate text-xs">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default AmenityCheckboxList;
