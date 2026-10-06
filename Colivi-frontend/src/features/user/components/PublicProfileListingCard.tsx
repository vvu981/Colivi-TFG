import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize2, Sparkles, ImageOff } from 'lucide-react';
import type { AccommodationListingResponse } from '../../housing/types/listing.types';

export interface PublicProfileListingCardProps {
  listing: AccommodationListingResponse;
}

/**
 * Individual accommodation listing card for public profile view.
 * Single Responsibility: Visual representation of a user's published listing.
 */
export const PublicProfileListingCard: React.FC<PublicProfileListingCardProps> = ({
  listing,
}) => {
  const [imageError, setImageError] = useState(false);

  const coverImage =
    listing.selectedImages?.[0]?.imageUrl ||
    listing.accommodation?.images?.[0]?.imageUrl;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);

  const rentalTypeLabel =
    listing.rentalType === 'ROOM' ? 'Habitación' : 'Alojamiento completo';

  const { accommodation } = listing;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group bg-surface-container-lowest rounded-3xl border border-outline-variant/60 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full bg-surface-container overflow-hidden shrink-0">
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-2 bg-surface-container-low">
            <ImageOff size={32} className="opacity-40" />
            <span className="text-[11px] font-medium opacity-60">Sin imagen</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface/90 backdrop-blur-xs text-on-surface shadow-xs">
            {rentalTypeLabel}
          </span>
          {listing.isPromoted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-on-primary shadow-xs">
              <Sparkles size={12} />
              Destacado
            </span>
          )}
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-surface/95 backdrop-blur-xs text-primary font-extrabold text-sm shadow-md border border-outline-variant/30">
          {formattedPrice}
          <span className="text-[11px] font-medium text-on-surface-variant ml-0.5">/mes</span>
        </div>
      </div>

      {/* Body Information */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>

          {accommodation && (
            <p className="flex items-center gap-1 text-xs text-on-surface-variant mt-1.5 line-clamp-1">
              <MapPin size={13} className="text-primary shrink-0" />
              <span>
                {[accommodation.address, accommodation.city, accommodation.province]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </p>
          )}
        </div>

        {/* Specs Bar */}
        {accommodation && (
          <div className="flex items-center gap-4 pt-3 border-t border-outline-variant/40 text-xs text-on-surface-variant font-medium">
            {accommodation.totalRooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed size={14} className="text-primary" />
                <span>{accommodation.totalRooms} hab.</span>
              </div>
            )}
            {accommodation.totalBathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath size={14} className="text-primary" />
                <span>{accommodation.totalBathrooms} baños</span>
              </div>
            )}
            {accommodation.squareMeters && (
              <div className="flex items-center gap-1">
                <Maximize2 size={14} className="text-primary" />
                <span>{accommodation.squareMeters} m²</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
