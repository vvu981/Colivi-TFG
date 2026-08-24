import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {  MapPin, Loader2, Home, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { MainLayout } from '../layouts/MainLayout';
import { ListingForm } from '../features/housing/components/listing/ListingForm';
import { useMyAccommodations } from '../features/housing/hooks/useMyAccommodations';
import { useCreateListing } from '../features/housing/hooks/useCreateListing';
import type { AccommodationResponse } from '../features/housing/types/accommodation.types';
import type { AccommodationListingRequest } from '../features/housing/types/listing.types';

export const CreateListingPage = () => {
  const navigate = useNavigate();

  // Load user's accommodations to pick from
  const {
    accommodations,
    isLoading: isLoadingAccommodations,
    error: accommodationsError,
  } = useMyAccommodations(0, 50); // Get up to 50 accommodations for the picker

  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationResponse | null>(null);

  const {
    createListing,
    isLoading: isCreatingListing,
    error: listingError,
  } = useCreateListing();

  const handleListingSubmit = async (data: AccommodationListingRequest) => {
    const result = await createListing(data);
    if (result) {
      // Navigate to my-listings or to the specific listing
      navigate(`/my-listings`, { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-xl">
          <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-sm">
            Publicar un anuncio
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Selecciona uno de tus alojamientos registrados para publicarlo y encontrar inquilinos.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {/* ── Section 1: Accommodation Picker ────────────────────────── */}
          <section className="flex flex-col gap-4">
            <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary text-label-md font-label-md">
                1
              </span>
              ¿Qué alojamiento quieres anunciar?
            </h2>

            {isLoadingAccommodations ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : accommodationsError ? (
              <div className="rounded-lg bg-error-container text-on-error-container p-4 text-label-md font-label-md">
                {accommodationsError}
              </div>
            ) : accommodations.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-outline-variant p-8 flex flex-col items-center text-center gap-4">
                <Home size={40} className="text-on-surface-variant/50" />
                <div>
                  <h3 className="text-label-lg font-label-lg text-on-surface mb-1">
                    No tienes alojamientos registrados
                  </h3>
                  <p className="text-body-md font-body-md text-on-surface-variant">
                    Para publicar un anuncio, primero debes dar de alta el inmueble físico.
                  </p>
                </div>
                <Link
                  to="/create-accommodation"
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary text-label-md font-label-md mt-2"
                >
                  Registrar alojamiento
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {accommodations.map((acc) => {
                  const isSelected = selectedAccommodation?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccommodation(acc)}
                      className={clsx(
                        'flex flex-col gap-2 p-5 rounded-xl border-2 text-left transition-all duration-200 relative',
                        isSelected
                          ? 'border-primary bg-primary-fixed/5 shadow-sm'
                          : 'border-outline-variant bg-surface hover:border-primary/50',
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-primary">
                          <CheckCircle size={20} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-label-md font-label-md text-on-surface pr-8">
                        <MapPin size={16} className={isSelected ? 'text-primary' : 'text-on-surface-variant'} />
                        <span className="truncate">{acc.address}</span>
                      </div>
                      <div className="text-label-sm font-label-sm text-on-surface-variant">
                        {acc.city}, {acc.province}
                      </div>
                      <div className="text-label-sm font-label-sm text-on-surface-variant mt-1 flex gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high">
                          {acc.totalRooms} hab.
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high">
                          {acc.squareMeters} m²
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Section 2: Listing Form ──────────────────────────────── */}
          {selectedAccommodation && (
            <section className="flex flex-col gap-6 pt-6 border-t border-outline-variant animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary text-label-md font-label-md">
                  2
                </span>
                Detalles del anuncio
              </h2>
              
              <ListingForm
                accommodation={selectedAccommodation}
                onSubmit={handleListingSubmit}
                isLoading={isCreatingListing}
                error={listingError}
              />
            </section>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
