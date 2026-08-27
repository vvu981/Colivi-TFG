import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, ArrowRight } from 'lucide-react';
import { listingService } from '../../api/listingService';
import type { AccommodationListingResponse } from '../../types/listing.types';

export interface SiblingRoomsSectionProps {
  accommodationId: string;
  currentListingId: string;
}

/**
 * Section displaying other available rooms in the same physical property (Co-living concept).
 * Single Responsibility: Presenting related room listings for the same accommodation.
 */
export const SiblingRoomsSection: React.FC<SiblingRoomsSectionProps> = ({
  accommodationId,
  currentListingId,
}) => {
  const [siblingListings, setSiblingListings] = useState<AccommodationListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!accommodationId) return;

    let cancelled = false;
    setIsLoading(true);

    listingService
      .getByAccommodationId(accommodationId)
      .then((data) => {
        if (!cancelled) {
          const others = data.filter((l) => l.id !== currentListingId);
          setSiblingListings(others);
        }
      })
      .catch(() => {
        // Silently ignore if fails
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accommodationId, currentListingId]);

  if (isLoading || siblingListings.length === 0) {
    return null;
  }

  return (
    <section className="py-8 border-t border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Bed size={22} className="text-primary" />
            <span>Otras habitaciones en este mismo piso</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Explora las demás habitaciones disponibles para co-living en esta vivienda
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {siblingListings.map((room) => {
          const cover =
            room.selectedImages?.[0]?.imageUrl || room.accommodation?.images?.[0]?.imageUrl;
          const formattedPrice = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(room.pricePerMonth);

          return (
            <Link
              key={room.id}
              to={`/listings/${room.id}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-lowest hover:shadow-md hover:border-primary/50 transition-all duration-300"
            >
              <div className="relative h-40 bg-surface-container-low overflow-hidden">
                {cover ? (
                  <img
                    src={cover}
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                    <Bed size={28} />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-container-lowest/90 backdrop-blur-sm text-primary shadow-xs">
                  {formattedPrice} / mes
                </div>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  {room.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-primary font-medium">
                  <span>Ver habitación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
