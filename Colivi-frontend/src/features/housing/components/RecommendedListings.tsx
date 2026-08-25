import React from 'react';
import type { AccommodationListingResponse } from '../types/listing.types';

// ── Skeleton card ─────────────────────────────────────────────────────────────

const ListingCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-[#dec0b7] animate-pulse">
    <div className="h-48 bg-[#dce9ff]" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-[#dce9ff] rounded-md w-3/4" />
      <div className="h-3 bg-[#dce9ff] rounded-md w-1/2" />
      <div className="h-3 bg-[#dce9ff] rounded-md w-1/3" />
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
    <article
      className={[
        'group bg-white rounded-2xl overflow-hidden flex flex-col transition-shadow duration-300',
        'hover:shadow-[0_8px_32px_rgba(15,23,42,0.12)]',
        listing.isPromoted
          ? 'border-2 border-[#9f3c16] shadow-[0_0_0_1px_rgba(159,60,22,0.15)]'
          : 'border border-[#dec0b7]',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative h-48 bg-[#e5eeff] overflow-hidden flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8a726a]">
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
          <span className="absolute top-3 left-3 bg-[#9f3c16] text-white text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase">
            Destacado
          </span>
        )}

        {/* Accommodation type pill */}
        <span className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-[#0b1c30] text-xs font-medium px-2.5 py-1 rounded-full border border-[#dec0b7]">
          {listing.rentalType === 'ROOM' ? 'Habitación' : 'Alojamiento completo'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="text-headline-sm text-[#0b1c30] line-clamp-2 leading-snug group-hover:text-[#9f3c16] transition-colors">
          {listing.title}
        </h3>

        <p className="text-label-md text-[#565e74] flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-[#8a726a] flex-shrink-0"
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
        <p className="mt-auto pt-2 text-[#9f3c16] font-semibold text-lg leading-none">
          {formattedPrice}
          <span className="text-sm text-[#565e74] font-normal">/mes</span>
        </p>
      </div>
    </article>
  );
};

// ── Error state ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-[#ba1a1a]"
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
    <p className="text-body-md text-[#57423b]">{message}</p>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-[#565e74]"
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
    <p className="text-body-md text-[#57423b]">
      Aún no tenemos recomendaciones para ti. ¡Empieza a explorar!
    </p>
  </div>
);

// ── Main exported component ───────────────────────────────────────────────────

interface RecommendedListingsProps {
  listings: AccommodationListingResponse[];
  isLoading: boolean;
  error: string | null;
}

const SKELETON_COUNT = 8;

export const RecommendedListings: React.FC<RecommendedListingsProps> = ({
  listings,
  isLoading,
  error,
}) => {
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

  return (
    <section aria-labelledby="recommendations-heading" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2
          id="recommendations-heading"
          className="text-headline-md text-[#0b1c30]"
        >
          Anuncios que te podrían interesar
        </h2>
      </div>

      {renderContent()}
    </section>
  );
};
