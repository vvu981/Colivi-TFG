import { Link } from 'react-router-dom';
import { Home, PlusCircle, MapPin, Loader2, Image as ImageIcon, Pencil } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { useMyAccommodations } from '../features/housing/hooks/useMyAccommodations';

export const MyAccommodationsPage = () => {
  const { accommodations, isLoading, error } = useMyAccommodations(0, 50);

  return (
    <MainLayout>
      <div className="w-full px-margin-mobile md:px-margin-desktop py-xl max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-xl">
          <div>
            <h1 className="text-display-lg-mobile md:text-headline-md font-headline-md text-on-surface mb-xs">
              Mis alojamientos
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Gestiona los inmuebles físicos que tienes registrados en la plataforma.
            </p>
          </div>
          <Link
            to="/create-accommodation"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-label-md hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={18} />
            Registrar alojamiento
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
        ) : accommodations.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <Home size={32} className="text-on-surface-variant" />
            </div>
            <div>
              <h3 className="text-title-lg font-title-lg text-on-surface mb-2">
                Aún no tienes alojamientos
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant max-w-md">
                Registra tu primer inmueble para empezar a crear anuncios y encontrar inquilinos.
              </p>
            </div>
            <Link
              to="/create-accommodation"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary text-label-md font-label-md mt-4 shadow-sm hover:opacity-90"
            >
              Comenzar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((acc) => (
              <div key={acc.id} className="flex flex-col bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image placeholder / thumbnail */}
                <div className="w-full h-48 bg-surface-container-high relative flex items-center justify-center overflow-hidden">
                  {acc.images && acc.images.length > 0 ? (
                    <img 
                      src={[...acc.images].sort((a, b) => a.displayOrder - b.displayOrder)[0].imageUrl} 
                      alt="Alojamiento" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={40} className="text-on-surface-variant/30" />
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-surface/90 backdrop-blur-sm rounded-full text-label-sm font-label-sm shadow-sm">
                    {acc.totalRooms} hab.
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start gap-2 text-label-md font-label-md text-on-surface mb-2">
                    <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{acc.address}</span>
                  </div>
                  
                  <div className="text-body-md font-body-md text-on-surface-variant mb-4">
                    {acc.city}, {acc.province}
                  </div>
                  
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-outline-variant">
                    <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">
                      {acc.squareMeters} m²
                    </span>
                    <div className="flex gap-3">
                      <Link 
                        to={`/edit-accommodation/${acc.id}`}
                        className="flex items-center justify-center p-2 rounded-lg border border-outline hover:bg-surface-container text-on-surface-variant transition-colors"
                        title="Editar alojamiento"
                      >
                        <Pencil size={18} />
                      </Link>
                      <Link 
                        to="/create-listing" 
                        className="text-primary text-label-sm font-label-sm font-semibold hover:underline self-center"
                      >
                        Publicar anuncio
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
