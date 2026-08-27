import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Home } from 'lucide-react';
import type { AccommodationListingResponse } from '../types/listing.types';

// ── Skeleton card ─────────────────────────────────────────────────────────────

const ListingCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-outline-variant animate-pulse">
    <div className="h-48 bg-surface-container" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-surface-container rounded-md w-3/4" />
      <div className="h-3 bg-surface-container rounded-md w-1/2" />
      <div className="h-3 bg-surface-container rounded-md w-1/3" />
    </div>
  </div>
);

// ── Individual listing card ───────────────────────────────────────────────────

interface ListingCardProps {
  listing: AccommodationListingResponse;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const coverImage = listing.selectedImages?.[0]?.imageUrl || listing.accommodation?.images?.[0]?.imageUrl;
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className={[
        'group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 block',
        'hover:shadow-[0_8px_32px_rgba(15,23,42,0.12)] hover:-translate-y-1',
        listing.isPromoted
          ? 'border-2 border-primary ring-1 ring-primary/20'
          : 'border border-outline-variant',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative h-48 bg-surface-container overflow-hidden flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5v-15a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v15a1.5 1.5 0 001.5 1.5zM8.25 9.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
              />
            </svg>
          </div>
        )}

        {/* Promoted badge */}
        {listing.isPromoted && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase">
            Destacado
          </span>
        )}

        {/* Accommodation type pill */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-on-surface text-xs font-semibold px-2.5 py-1 rounded-full border border-outline-variant shadow-xs flex items-center gap-1.5">
          {listing.rentalType === 'ROOM' ? (
            <>
              <Bed size={13} className="text-primary" />
              <span>Habitación</span>
            </>
          ) : (
            <>
              <Home size={13} className="text-primary" />
              <span>Alojamiento completo</span>
            </>
          )}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="text-headline-sm text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-on-surface-variant flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <span className="truncate">
            {listing.accommodation?.city}
            {listing.accommodation?.address ? `, ${listing.accommodation.address}` : ''}
          </span>
        </p>

        {/* Price */}
        <p className="mt-auto pt-2 text-primary font-semibold text-lg leading-none">
          {formattedPrice}
          <span className="text-sm text-on-surface-variant font-normal">/mes</span>
        </p>
      </div>
    </Link>
  );
};

// ── Error state ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-error"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>
    <p className="text-body-md text-on-surface-variant">{message}</p>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-on-surface-variant"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    </div>
    <p className="text-body-md text-on-surface-variant">
      Aún no tenemos recomendaciones para ti. ¡Empieza a explorar!
    </p>
  </div>
);

// ── Main exported component ───────────────────────────────────────────────────

import { SearchX, Sparkles } from 'lucide-react';
import type { RecommendationResponse } from '../types/listing.types';

interface RecommendedListingsProps {
  data: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
}

const SKELETON_COUNT = 8;

export const RecommendedListings: React.FC<RecommendedListingsProps> = ({
  data,
  isLoading,
  error,
}) => {
  const listings = data?.items ?? [];
  const isFallback = Boolean(data?.hasCriteria && data?.fallbackApplied && data?.criteriaMatchedCount === 0);
  const searchedCity = data?.searchCity;
  const searchedTitle = data?.searchTitle;

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (listings.length === 0) return <EmptyState />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    );
  };

  const getHeadingTitle = () => {
    if (isFallback) {
      return 'Otros alojamientos destacados que podrían interesarte';
    }
    if (searchedTitle && (data?.criteriaMatchedCount ?? 0) > 0) {
      return `Alojamientos que coinciden con "${searchedTitle}"`;
    }
    if (searchedCity && (data?.criteriaMatchedCount ?? 0) > 0) {
      return `Alojamientos disponibles en ${searchedCity}`;
    }
    return 'Anuncios que te podrían interesar';
  };

  const getFallbackAlertTitle = () => {
    if (searchedTitle && searchedCity) {
      return `No se encontraron anuncios para "${searchedTitle}" en ${searchedCity}`;
    }
    if (searchedTitle) {
      return `No se encontraron anuncios con el nombre "${searchedTitle}"`;
    }
    if (searchedCity) {
      return `No se encontraron anuncios en "${searchedCity}"`;
    }
    return 'No se encontraron anuncios con los filtros seleccionados';
  };

  return (
    <section aria-labelledby="recommendations-heading" className="w-full flex flex-col gap-3">
      {/* Banner informativo cuando la búsqueda no arrojó resultados y se aplicó fallback */}
      {!isLoading && !error && isFallback && (
        <div
          role="status"
          className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-error-container text-on-surface-variant shadow-xs animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="p-2.5 rounded-xl bg-error-container/60 text-primary flex-shrink-0 mt-0.5">
            <SearchX size={20} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-body-lg font-bold text-on-surface">
              {getFallbackAlertTitle()}
            </h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Aún no hay publicaciones disponibles que coincidan con estos criterios. A continuación te mostramos algunos de los alojamientos más populares y destacados de la plataforma:
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFallback && <Sparkles size={20} className="text-primary" />}
          <h2
            id="recommendations-heading"
            className="text-headline-md text-on-surface"
          >
            {getHeadingTitle()}
          </h2>
        </div>
      </div>

      {renderContent()}
    </section>
  );
};
