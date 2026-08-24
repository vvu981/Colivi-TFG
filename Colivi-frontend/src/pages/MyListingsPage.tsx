import { Link } from 'react-router-dom';
import { FileText, PlusCircle, Loader2, MapPin, Euro, Pencil, Home, DoorOpen } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { useMyListings } from '../features/housing/hooks/useMyListings';
import clsx from 'clsx';

export const MyListingsPage = () => {
  const { listings, isLoading, error } = useMyListings(0, 50);

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-xl">
          <div>
            <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-xs">
              Mis anuncios
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Gestiona los anuncios publicados para tus alojamientos.
            </p>
          </div>
          <Link
            to="/create-listing"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={18} />
            Publicar anuncio
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-error-container text-on-error-container p-4 text-label-md font-label-md">
            {error}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <FileText size={32} className="text-on-surface-variant" />
            </div>
            <div>
              <h3 className="text-title-lg font-title-lg text-on-surface mb-2">
                No tienes anuncios publicados
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant max-w-md">
                Publica un anuncio sobre alguno de tus alojamientos registrados para empezar a encontrar inquilinos.
              </p>
            </div>
            <Link
              to="/create-listing"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary text-label-md font-label-md mt-4 shadow-sm hover:opacity-90"
            >
              Publicar anuncio
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((listing) => {
              const acc = listing.accommodation;
              const isAvailable = listing.status === 'AVAILABLE';

              return (
                <div key={listing.id} className="flex flex-col sm:flex-row bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="w-full sm:w-48 h-48 sm:h-auto bg-surface-container-high relative flex-shrink-0">
                    {acc?.images && acc.images.length > 0 ? (
                      <img 
                        src={[...acc.images].sort((a, b) => a.displayOrder - b.displayOrder)[0].imageUrl} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText size={32} className="text-on-surface-variant/30" />
                      </div>
                    )}
                    <div className={clsx(
                      "absolute top-3 left-3 px-3 py-1 rounded-full text-label-sm font-label-sm shadow-sm",
                      isAvailable ? "bg-green-100 text-green-800" : "bg-surface/90 text-on-surface"
                    )}>
                      {isAvailable ? 'Disponible' : 'Oculto'}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-title-lg font-title-lg text-on-surface line-clamp-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-primary font-bold whitespace-nowrap">
                        <Euro size={18} className="mr-1" />
                        {listing.pricePerMonth}
                        <span className="text-label-sm font-normal text-on-surface-variant ml-1">/mes</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-md font-body-md text-on-surface-variant mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} />
                        <span className="truncate">{acc ? `${acc.city}, ${acc.province}` : 'Ubicación no disponible'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-outline-variant pl-4">
                        {listing.rentalType === 'ENTIRE_PLACE' ? (
                          <>
                            <Home size={16} />
                            <span>Piso completo</span>
                          </>
                        ) : (
                          <>
                            <DoorOpen size={16} />
                            <span>Habitación</span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-body-md font-body-md text-on-surface-variant line-clamp-2 mb-4">
                      {listing.description}
                    </p>
                    
                    <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-outline-variant">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md transition-colors flex items-center justify-center"
                      >
                        Ver página
                      </Link>
                      <Link
                        to={`/edit-listing/${listing.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline hover:bg-surface-container text-on-surface text-label-md font-label-md transition-colors"
                        title="Editar anuncio"
                      >
                        <Pencil size={18} />
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
