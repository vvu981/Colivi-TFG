import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useHomes } from '../features/home/hooks/useHomes';
import { HomeCard } from '../features/home/components/HomeCard';
import { Archive, ChevronLeft, Search } from 'lucide-react';
import { Spinner } from '../components/feedback/Spinner';
import { MainLayout } from '../layouts/MainLayout';

export const ArchivedHomesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    homes,
    isLoading,
    error,
    unarchiveHome,
  } = useHomes('ARCHIVED');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredHomes = useMemo(() => {
    if (!searchQuery.trim()) return homes;
    const q = searchQuery.toLowerCase();
    return homes.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.invitationCode && h.invitationCode.toLowerCase().includes(q))
    );
  }, [homes, searchQuery]);

  const handleOpenDetail = (id: string) => {
    navigate(`/homes/${id}`);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Botón Volver */}
          <div>
            <Link
              to="/homes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Mis Hogares</span>
            </Link>
          </div>

          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                    Hogares Archivados
                  </h1>
                  <p className="text-xs sm:text-sm text-secondary mt-0.5">
                    Hogares pasados almacenados en frío. Puedes consultar su historial o desarchivarlos.
                  </p>
                </div>
              </div>
            </div>

            {/* Buscador */}
            {homes.length > 0 && (
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en archivados..."
                  className="w-full pl-9 pr-3.5 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              </div>
            )}
          </div>

          {/* Estado de Error */}
          {error && (
            <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl text-xs text-error font-medium text-center">
              {error}
            </div>
          )}

          {/* Listado de Hogares Archivados */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : filteredHomes.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-surface-container text-secondary flex items-center justify-center mx-auto">
                <Archive className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {searchQuery ? 'No se encontraron resultados' : 'No tienes hogares archivados'}
                </h3>
                <p className="text-xs text-secondary mt-1 max-w-md mx-auto leading-relaxed">
                  {searchQuery
                    ? 'Prueba a buscar con otro término o borra el filtro de búsqueda.'
                    : 'Cuando archives un hogar desde tu pestaña de Salidos / Historial, se guardará aquí para no ocupar espacio en tu lista principal.'}
                </p>
              </div>

              {!searchQuery && (
                <div className="pt-2">
                  <Link
                    to="/homes"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors shadow-xs"
                  >
                    <span>Ir a Mis Hogares</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHomes.map((home) => (
                <HomeCard
                  key={home.id}
                  home={home}
                  onOpenDetail={handleOpenDetail}
                  onUnarchive={async (h) => await unarchiveHome(h.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
