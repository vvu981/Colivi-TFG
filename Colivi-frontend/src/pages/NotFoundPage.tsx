import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPinOff, ArrowLeft, Map } from "lucide-react";
import { MainLayout } from "../layouts/MainLayout";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="w-full min-h-[calc(100vh-180px)] flex items-center justify-center px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-12">
        <div className="max-w-xl w-full text-center flex flex-col items-center">
          {/* Decorative Icon / 404 Badge */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#ffdbcf]/50 border border-[#dec0b7] flex items-center justify-center text-[#9f3c16] shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <MapPinOff className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-[#9f3c16] text-white text-xs font-bold rounded-full uppercase tracking-wider shadow">
              Error 404
            </span>
          </div>

          {/* Heading and Description */}
          <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight mb-3">
            Página no encontrada
          </h1>
          <p className="text-body-md text-[#565e74] max-w-md mx-auto mb-8">
            Lo sentimos, el espacio o enlace que buscas no existe, ha sido trasladado o la dirección introducida no es correcta.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#9f3c16] hover:bg-[#bf542c] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#9f3c16] focus:ring-offset-2"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Ir a la búsqueda</span>
            </Link>

            <Link
              to="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-[#dec0b7] hover:bg-[#f8f9ff] text-[#565e74] hover:text-[#0b1c30] font-medium px-5 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#dec0b7] focus:ring-offset-2"
            >
              <Map className="w-4 h-4 text-[#9f3c16]" aria-hidden="true" />
              <span>Explorar en el mapa</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[#565e74] hover:text-[#9f3c16] font-medium px-4 py-3 rounded-xl transition-colors duration-200 text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Volver atrás</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
