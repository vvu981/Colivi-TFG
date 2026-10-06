import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <main className="antialiased min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#FAF8F5]">
      {/* ── Columna Izquierda (Formulario) ── */}
      <div className="flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 max-w-xl mx-auto w-full">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img src="/favicon.png" alt="Colivi" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-primary font-sans">
                Colivi
              </span>
            </Link>
          </div>

          {/* Títulos */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0b1c30] tracking-tight leading-tight mb-2 font-sans">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-[#565e74] leading-relaxed font-sans">
              {subtitle}
            </p>
          </div>

          {/* Formulario */}
          {children}
        </div>
      </div>

      {/* ── Columna Derecha (imagen destacada, solo desktop) ── */}
      <div className="hidden lg:block relative overflow-hidden h-full min-h-screen">
        <img
          alt="Sala de estar moderna de un coliving"
          src="/img/high_quality_background_Auth.png"
          className="absolute inset-0 w-full h-full object-cover rounded-l-3xl"
        />
        {/* Tarjeta flotante */}
        <div className="absolute bottom-12 left-12 right-12 max-w-sm bg-white/95 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.10)]">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#eff4ff] rounded-full text-primary shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">
                groups
              </span>
            </div>
            <p className="text-[15px] text-[#0b1c30] font-medium leading-relaxed font-sans">
              "Más de 2.000 inquilinos ya han encontrado su hogar ideal sin papeleos"
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};