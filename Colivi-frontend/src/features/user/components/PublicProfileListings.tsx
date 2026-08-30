import React from 'react';
import { Link } from 'react-router-dom';
import { Home, PlusCircle } from 'lucide-react';
import type { AccommodationListingResponse } from '../../housing/types/listing.types';
import { PublicProfileListingCard } from './PublicProfileListingCard';

export interface PublicProfileListingsProps {
  listings: AccommodationListingResponse[];
  userNickname?: string;
  isSelf: boolean;
}

/**
 * Public profile published listings section.
 * Single Responsibility: Presenting catalog of colivings/rooms published by the user or empty state.
 */
export const PublicProfileListings: React.FC<PublicProfileListingsProps> = ({
  listings,
  userNickname,
  isSelf,
}) => {
  const hasListings = listings && listings.length > 0;

  return (
    <section className="w-full flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Home size={20} />
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Alojamientos publicados
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant">
            {listings.length}
          </span>
        </div>

        {isSelf && hasListings && (
          <Link
            to="/my-listings"
            className="text-xs font-bold text-primary hover:underline"
          >
            Gestionar mis anuncios →
          </Link>
        )}
      </div>

      {/* Grid or Empty State */}
      {hasListings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <PublicProfileListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full py-12 px-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center justify-center text-center gap-3 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center mb-1">
            <Home size={30} className="opacity-50" />
          </div>
          <h3 className="text-base font-bold text-on-surface">
            Sin alojamientos publicados
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
            {isSelf
              ? 'Aún no has publicado ningún anuncio. Comienza creando tu alojamiento y publicando habitaciones para encontrar compañeros.'
              : `${userNickname ? `@${userNickname}` : 'Este usuario'} aún no tiene ningún alojamiento publicado o disponible en Colivi.`}
          </p>
          {isSelf && (
            <Link
              to="/create-accommodation"
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-bold text-xs hover:bg-on-primary-fixed-variant transition-colors shadow-xs"
            >
              <PlusCircle size={16} />
              <span>Publicar alojamiento</span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
};
