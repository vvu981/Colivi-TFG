import React from 'react';
import type { AmenityType } from '../../types/accommodation.types';
import { AMENITY_CONFIG, ALL_AMENITIES } from '../../constants/amenityConfig';

export interface ListingAmenitiesViewProps {
  amenities: AmenityType[];
}

/**
 * Visual grid presenting the amenities available in the property.
 * Single Responsibility: Displaying property amenities using the centralized AMENITY_CONFIG.
 */
export const ListingAmenitiesView: React.FC<ListingAmenitiesViewProps> = ({ amenities }) => {
  const activeAmenities = amenities || [];
  const includedAmenities = ALL_AMENITIES.filter((amenity) => activeAmenities.includes(amenity));

  return (
    <section className="py-6 border-b border-outline-variant">
      <h2 className="text-lg font-bold text-on-surface mb-1">
        Lo que ofrece este lugar
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">
        Servicios y comodidades incluidas en el alojamiento
      </p>

      {includedAmenities.length === 0 ? (
        <p className="text-body-md text-on-surface-variant italic">
          No se han especificado servicios adicionales para este alojamiento.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {includedAmenities.map((amenity) => {
            const { label, icon: Icon } = AMENITY_CONFIG[amenity];

            return (
              <div
                key={amenity}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-2xs transition-all hover:border-primary/40"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Icon size={18} />
                </div>
                <span className="text-xs font-semibold text-on-surface">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
