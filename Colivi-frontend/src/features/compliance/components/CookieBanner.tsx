import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Settings } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';

export const CookieBanner: React.FC = () => {
  const { isBannerVisible, acceptAll, rejectNonEssential, openPreferencesModal } = useCookieConsent();

  if (!isBannerVisible) return null;

  return (
    <aside
      aria-label="Aviso de cookies"
      role="region"
      className="fixed bottom-36 sm:bottom-8 inset-x-3 sm:inset-x-auto sm:left-6 sm:right-auto sm:max-w-md z-[60] bg-surface-container-lowest text-on-surface border border-outline-variant rounded-2xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Cookie size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Tu privacidad es prioritaria en Colivi</h2>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Utilizamos cookies técnicas obligatorias para el funcionamiento seguro de la plataforma. Con tu permiso,
            también empleamos cookies analíticas y de personalización para optimizar tu experiencia.{' '}
            <Link to="/cookies" className="text-primary hover:underline font-medium">
              Política de Cookies
            </Link>{' '}
            y{' '}
            <Link to="/privacy" className="text-primary hover:underline font-medium">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
        <button
          type="button"
          onClick={openPreferencesModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
        >
          <Settings size={14} />
          <span>Personalizar</span>
        </button>
        <button
          type="button"
          onClick={rejectNonEssential}
          className="px-4 py-2 text-xs font-semibold text-on-surface bg-surface border border-outline-variant hover:bg-surface-container rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
        >
          Rechazar no esenciales
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
        >
          Aceptar todas
        </button>
      </div>
    </aside>
  );
};
