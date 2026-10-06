import { Link } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { RecommendedListings } from "../features/housing/components/RecommendedListings";
import { SearchBar } from "../features/housing/components/SearchBar";
import { useRecommendations } from "../features/housing/hooks/useRecommendations";
import { Map, ArrowRight } from "lucide-react";

export const HomePage = () => {
  const { data, isLoading, error, search, reset } = useRecommendations();

  return (
    <MainLayout>
      <div className="w-full px-4 sm:px-6 md:px-margin-desktop py-6 sm:py-10 flex flex-col gap-8 sm:gap-10 max-w-7xl mx-auto">
        {/* Hero heading */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-on-surface mb-2 tracking-tight">
            Explorar Coliving
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary">
            Encuentra tu próximo hogar compartido entre miles de anuncios verificados.
          </p>
        </div>

        {/* Banner de acceso directo al mapa */}
        <Link
          to="/map"
          className="group flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-surface-container-low rounded-2xl border border-primary/20 hover:border-primary/40 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Map size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                ¿Prefieres buscar por zona en el mapa?
              </h2>
              <p className="text-xs sm:text-sm text-secondary">
                Explora habitaciones y pisos completos en nuestro mapa interactivo con clústeres.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs sm:text-sm font-bold shrink-0 ml-2">
            <span className="hidden sm:inline">Ver mapa</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Search bar — triggers active search or reset for the current session */}
        <SearchBar onSearch={search} onReset={reset} />

        {/* Recommendations section */}
        <RecommendedListings
          data={data}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </MainLayout>
  );
};