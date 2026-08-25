import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { ListingForm } from '../features/housing/components/listing/ListingForm';
import { useGetListing } from '../features/housing/hooks/useGetListing';
import { useUpdateListing } from '../features/housing/hooks/useUpdateListing';
import type { AccommodationListingRequest } from '../features/housing/types/listing.types';

export const EditListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { listing, isLoading: isFetching, error: fetchError } = useGetListing(id);
  const { updateListing, isLoading: isUpdating, error: updateError } = useUpdateListing();

  const handleSubmit = async (data: AccommodationListingRequest) => {
    if (!id) return;
    
    // updateListing expects an AccommodationListingUpdateRequest
    const updated = await updateListing(id, {
      title: data.title,
      description: data.description,
      pricePerMonth: data.pricePerMonth,
      securityDeposit: data.securityDeposit,
      selectedImages: data.selectedImages,
    });
    
    if (updated) {
      navigate('/my-listings', { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl max-w-3xl mx-auto">
        <div className="mb-2xl">
          <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-sm">
            Editar anuncio
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Actualiza el título, la descripción o el precio de tu anuncio.
          </p>
        </div>

        {isFetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : fetchError ? (
          <div className="rounded-lg bg-error-container text-on-error-container p-4 text-label-md font-label-md">
            {fetchError}
          </div>
        ) : listing ? (
          <ListingForm
            accommodation={listing.accommodation}
            initialData={listing}
            onSubmit={handleSubmit}
            isLoading={isUpdating}
            error={updateError}
            submitText="Guardar cambios"
          />
        ) : null}
      </div>
    </MainLayout>
  );
};
