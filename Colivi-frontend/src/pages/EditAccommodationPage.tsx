import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Home, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { AccommodationForm } from '../features/housing/components/accommodation/AccommodationForm';
import { ImageUploader } from '../features/housing/components/accommodation/ImageUploader';
import { useGetAccommodation } from '../features/housing/hooks/useGetAccommodation';
import { useUpdateAccommodation } from '../features/housing/hooks/useUpdateAccommodation';
import type { AccommodationRequest, AccommodationImageResponse } from '../features/housing/types/accommodation.types';

export const EditAccommodationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'photos'>('details');

  const { accommodation, isLoading: isFetching, error: fetchError } = useGetAccommodation(id);
  const { updateAccommodation, isLoading: isUpdating, error: updateError } = useUpdateAccommodation();
  const [images, setImages] = useState<AccommodationImageResponse[]>([]);

  useEffect(() => {
    if (accommodation?.images) {
      setImages(accommodation.images);
    }
  }, [accommodation]);

  const handleSubmit = async (data: AccommodationRequest) => {
    if (!id) return;
    const updated = await updateAccommodation(id, data);
    if (updated) {
      navigate('/my-accommodations', { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-10 max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/my-accommodations')}
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-medium transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Volver a mis alojamientos</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-1">
            Editar alojamiento
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Actualiza los datos de tu inmueble o gestiona su galería de fotos.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-outline-variant gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Home size={16} />
            <span>Datos del inmueble</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ImageIcon size={16} />
            <span>Fotos del alojamiento ({images.length})</span>
          </button>
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
          activeTab === 'details' ? (
            <AccommodationForm
              initialData={accommodation}
              onSubmit={handleSubmit}
              isLoading={isUpdating}
              error={updateError}
              submitText="Guardar cambios"
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant">
                Las fotos añadidas o eliminadas se actualizan de forma inmediata para todos los anuncios asociados a este alojamiento.
              </div>
              {id && (
                <ImageUploader
                  accommodationId={id}
                  images={images}
                  onImagesChange={setImages}
                />
              )}
            </div>
          )
        ) : null}
      </div>
    </MainLayout>
  );
};
