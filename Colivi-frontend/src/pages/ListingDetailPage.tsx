import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { useGetListing } from '../features/housing/hooks/useGetListing';
import { useAuth } from '../features/auth/context/AuthContext';
import { ListingHeader } from '../features/housing/components/listing/ListingHeader';
import { ListingGallery } from '../features/housing/components/listing/ListingGallery';
import { ListingSpecs } from '../features/housing/components/listing/ListingSpecs';
import { ListingHostCard } from '../features/housing/components/listing/ListingHostCard';
import { ListingAmenitiesView } from '../features/housing/components/listing/ListingAmenitiesView';
import { ListingLocationMap } from '../features/housing/components/listing/ListingLocationMap';
import { ListingReviewsSection } from '../features/housing/components/listing/ListingReviewsSection';
import { ListingBookingCard } from '../features/housing/components/listing/ListingBookingCard';
import { SiblingRoomsSection } from '../features/housing/components/listing/SiblingRoomsSection';
import { ReportListingModal } from '../features/report/components/ReportListingModal';
import { Spinner } from '../components/feedback/Spinner';

/**
 * Public detailed listing view page (/listings/:id).
 * Coordinates modular domain components following SOLID architecture.
 */
export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { listing, isLoading, error, refetch } = useGetListing(id);
  const { user } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-body-md text-on-surface-variant animate-pulse font-medium">
            Cargando detalles del anuncio…
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error || !listing) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">No se pudo cargar el anuncio</h1>
          <p className="text-body-md text-on-surface-variant">
            {error || 'El anuncio solicitado no existe o no está disponible en este momento.'}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-label-md font-semibold hover:bg-surface-container-high transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Volver al mapa</span>
            </Link>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { title, description, rentalType, selectedImages, accommodation, createdAt, hostId, hostNickname, hostProfilePicUrl } = listing;

  // Use selectedImages from listing first, fallback to accommodation images
  const images =
    selectedImages && selectedImages.length > 0
      ? selectedImages
      : accommodation?.images || [];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Header (Breadcrumbs, title, location, share, report) */}
        <ListingHeader
          listing={listing}
          currentUserId={user?.id}
          onReportClick={() => setIsReportModalOpen(true)}
        />

        {/* Photo Gallery with Bento Grid & Lightbox */}
        <ListingGallery images={images} title={title} />

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Details & Specs (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            {/* Host Card */}
            <ListingHostCard hostId={hostId} hostNickname={hostNickname} hostProfilePicUrl={hostProfilePicUrl} createdAt={createdAt} />

            {/* Key Specs Bar (Rooms, Bathrooms, SQM, Mode) */}
            <ListingSpecs accommodation={accommodation} rentalType={rentalType} />

            {/* Description Section */}
            <section className="py-6 border-b border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-3">
                Acerca de este alojamiento
              </h2>
              <div className="text-body-md text-on-surface/90 leading-relaxed whitespace-pre-line">
                {description}
              </div>
            </section>

            {/* Amenities Grid */}
            <ListingAmenitiesView amenities={accommodation.amenities || []} />

            {/* Location Map Section */}
            <ListingLocationMap
              latitude={accommodation.latitude}
              longitude={accommodation.longitude}
              address={accommodation.address}
              city={accommodation.city}
              province={accommodation.province}
              country={accommodation.country}
            />

            {/* Verified Reviews Section */}
            <ListingReviewsSection
              listingId={listing.id}
              listingTitle={title}
            />
          </div>

          {/* Right Column: Sticky Pricing Card (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <ListingBookingCard listing={listing} currentUserId={user?.id} />
          </div>
        </div>

        {/* Sibling Coliving Rooms in the same accommodation */}
        {rentalType === 'ROOM' && (
          <SiblingRoomsSection
            accommodationId={accommodation.id}
            currentListingId={listing.id}
          />
        )}

        {/* Report Listing Modal */}
        <ReportListingModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          listingId={listing.id}
          listingTitle={title}
        />
      </div>
    </MainLayout>
  );
};

export default ListingDetailPage;
