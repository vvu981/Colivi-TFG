import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { AccommodationForm } from '../features/housing/components/accommodation/AccommodationForm';
import { useGetAccommodation } from '../features/housing/hooks/useGetAccommodation';
import { useUpdateAccommodation } from '../features/housing/hooks/useUpdateAccommodation';
import type { AccommodationRequest } from '../features/housing/types/accommodation.types';

export const EditAccommodationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { accommodation, isLoading: isFetching, error: fetchError } = useGetAccommodation(id);
  const { updateAccommodation, isLoading: isUpdating, error: updateError } = useUpdateAccommodation();

  const handleSubmit = async (data: AccommodationRequest) => {
    if (!id) return;
    const updated = await updateAccommodation(id, data);
    if (updated) {
      navigate('/my-accommodations', { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl max-w-3xl mx-auto">
        <div className="mb-2xl">
          <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-sm">
            Editar alojamiento
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Actualiza los datos de tu inmueble. Los cambios se reflejarán en todos tus anuncios asociados.
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
        ) : accommodation ? (
          <AccommodationForm
            initialData={accommodation}
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
