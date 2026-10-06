import clsx from 'clsx';
import type { AmenityType } from '../../types/accommodation.types';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../../constants/amenityConfig';

// ── Props ───────────────────────────────────────────────────────────

interface AmenitySelectorProps {
  value: AmenityType[];
  onChange: (amenities: AmenityType[]) => void;
}

// ── Component ───────────────────────────────────────────────────────

/**
 * Visual chip-grid for selecting accommodation amenities.
 * Fully controlled — receives value and calls onChange on every toggle.
 */
export const AmenitySelector = ({ value, onChange }: AmenitySelectorProps) => {
  const toggle = (amenity: AmenityType) => {
    if (value.includes(amenity)) {
      onChange(value.filter((a) => a !== amenity));
    } else {
      onChange([...value, amenity]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3" id="amenity-selector">
      {ALL_AMENITIES.map((amenity) => {
        const { label, icon: Icon } = AMENITY_CONFIG[amenity];
        const isSelected = value.includes(amenity);

        return (
          <button
            key={amenity}
            type="button"
            id={`amenity-${amenity.toLowerCase()}`}
            onClick={() => toggle(amenity)}
            aria-pressed={isSelected}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full border text-label-md font-label-md transition-all duration-200',
              isSelected
                ? 'bg-primary text-on-primary border-primary shadow-sm scale-105'
                : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary',
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
};
