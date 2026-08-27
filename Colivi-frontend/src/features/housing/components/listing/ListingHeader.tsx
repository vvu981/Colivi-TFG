import React, { useState } from 'react';
import { MapPin, Share2, Sparkles, Home, Bed, Check } from 'lucide-react';
import type { AccommodationListingResponse } from '../../types/listing.types';

export interface ListingHeaderProps {
  listing: AccommodationListingResponse;
}

/**
 * Header section containing breadcrumbs, title, badges, location and share button.
 * Single Responsibility: Title and metadata presentation.
 */
export const ListingHeader: React.FC<ListingHeaderProps> = ({ listing }) => {
  const [copied, setCopied] = useState(false);

  const { title, rentalType, isPromoted, accommodation } = listing;
  const { city, province, country } = accommodation;

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const isRoom = rentalType === 'ROOM';

  return (
    <header className="flex flex-col gap-2">
      {/* Top Title & Actions row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isPromoted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-on-primary shadow-xs">
                <Sparkles size={12} />
                <span>Destacado</span>
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-xs font-medium cursor-pointer shadow-xs flex-shrink-0"
        >
          {copied ? <Check size={14} className="text-primary" /> : <Share2 size={14} />}
          <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
        </button>
      </div>

      {/* Subtitle with Rental Type & Location */}
      <div className="flex items-center gap-3 text-body-md text-on-surface-variant flex-wrap mt-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
          {isRoom ? (
            <>
              <Bed size={14} />
              <span>Habitación</span>
            </>
          ) : (
            <>
              <Home size={14} />
              <span>Alojamiento completo</span>
            </>
          )}
        </span>

        <span className="text-outline-variant font-light">•</span>

        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <MapPin size={15} className="text-primary flex-shrink-0" />
          <span>
            {[city, province, country].filter(Boolean).join(', ')}
          </span>
        </div>
      </div>
    </header>
  );
};
