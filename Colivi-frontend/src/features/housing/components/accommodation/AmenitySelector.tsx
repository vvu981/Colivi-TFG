import { Wifi, Thermometer, Wind, PawPrint, Building2, Sunset } from 'lucide-react';
import clsx from 'clsx';
import type { AmenityType } from '../../types/accommodation.types';

// ── Amenity metadata ────────────────────────────────────────────────

const AMENITY_CONFIG: Record<
  AmenityType,
  { label: string; icon: React.ReactNode }
> = {
  WIFI: { label: 'WiFi', icon: <Wifi size={18} /> },
  HEATING: { label: 'Calefacción', icon: <Thermometer size={18} /> },
  AIR_CONDITIONING: { label: 'Aire acond.', icon: <Wind size={18} /> },
  PETS_ALLOWED: { label: 'Mascotas', icon: <PawPrint size={18} /> },
  ELEVATOR: { label: 'Ascensor', icon: <Building2 size={18} /> },
  BALCONY: { label: 'Balcón', icon: <Sunset size={18} /> },
};

const ALL_AMENITIES = Object.keys(AMENITY_CONFIG) as AmenityType[];

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
        const { label, icon } = AMENITY_CONFIG[amenity];
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
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
};
