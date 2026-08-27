import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, Bed } from 'lucide-react';
import type { AccommodationListingResponse } from '../../types/listing.types';

export interface ListingCardProps {
  listing: AccommodationListingResponse;
  isHighlighted: boolean;
  onClick: (listing: AccommodationListingResponse) => void;
}

export const SidebarCard: React.FC<ListingCardProps> = ({ listing, isHighlighted, onClick }) => {
  const [imageError, setImageError] = useState(false);

  const coverImage =
    listing.selectedImages?.[0]?.imageUrl ??
    listing.accommodation?.images?.[0]?.imageUrl;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);

  const isRoom = listing.rentalType === 'ROOM';

  return (
    <article
      id={`listing-card-${listing.id}`}
      onClick={() => onClick(listing)}
      className={[
        'group relative flex gap-3 rounded-2xl border p-2.5 cursor-pointer transition-all duration-200 select-none',
        isHighlighted
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/40'
          : 'border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-xs hover:bg-surface-container-low/40',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/40">
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 bg-surface-container">
            <Home size={24} />
          </div>
        )}

        {/* Promoted mini badge */}
        {listing.isPromoted && (
          <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
            ★
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        {/* Top: Title & Location */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors leading-snug">
            {listing.title}
          </h3>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 truncate">
            <MapPin size={11} className="text-primary flex-shrink-0" />
            <span className="truncate">
              {[listing.accommodation?.city, listing.accommodation?.address].filter(Boolean).join(', ')}
            </span>
          </p>
        </div>

        {/* Middle: Rental Type Tag */}
        <div className="flex items-center gap-1.5 my-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/60">
            {isRoom ? (
              <>
                <Bed size={11} className="text-primary" />
                <span>Habitación</span>
              </>
            ) : (
              <>
                <Home size={11} className="text-primary" />
                <span>Completo</span>
              </>
            )}
          </span>
        </div>

        {/* Bottom: Price & Detail link */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-outline-variant/40 mt-auto">
          <div className="flex items-baseline gap-0.5 truncate">
            <span className="text-xs sm:text-sm font-extrabold text-on-surface">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-on-surface-variant font-normal">/mes</span>
          </div>

          <Link
            to={`/listings/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:opacity-80 transition-all flex-shrink-0 ml-1 py-0.5 px-1 rounded"
          >
            <span>Ver</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
