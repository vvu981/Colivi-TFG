import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cookie, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { COOKIE_DEFINITIONS } from '../data/cookieDefinitions';
import type { CookieCategory } from '../types/cookieTypes';

export const CookiePreferencesModal: React.FC = () => {
  const {
    isPreferencesModalOpen,
    closePreferencesModal,
    preferences,
    savePreferences,
    acceptAll,
    rejectNonEssential,
  } = useCookieConsent();

  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(false);
  const [marketingEnabled, setMarketingEnabled] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<CookieCategory, boolean>>({
    necessary: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (isPreferencesModalOpen) {
      setAnalyticsEnabled(preferences?.analytics ?? false);
      setMarketingEnabled(preferences?.marketing ?? false);
    }
  }, [isPreferencesModalOpen, preferences]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreferencesModalOpen) {
        closePreferencesModal();
      }
    };
    if (isPreferencesModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isPreferencesModalOpen, closePreferencesModal]);

  if (!isPreferencesModalOpen) return null;

  const toggleCategoryDetails = (id: CookieCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCustom = () => {
    savePreferences({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-on-surface/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      <div className="bg-surface-container-lowest text-on-surface border border-outline-variant rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/60 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Cookie size={22} />
            </div>
            <div>
              <h2 id="cookie-modal-title" className="text-lg font-bold text-on-surface leading-tight">
                Centro de Preferencias de Privacidad
              </h2>
              <p className="text-xs text-secondary">Control granular de cookies conforme al RGPD y Directiva ePrivacy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePreferencesModal}
            className="p-2 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
            aria-label="Cerrar modal de preferencias"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <p className="text-secondary leading-relaxed">
            En Colivi respetamos tu privacidad y autonomía digital. Puedes decidir qué categorías de cookies permites
            en este dispositivo. Las cookies técnicas son indispensables para la navegación y la seguridad de tu sesión,
            por lo que no pueden desactivarse.
          </p>

          <div className="space-y-4">
            {COOKIE_DEFINITIONS.map((category) => {
              const isChecked = category.required
                ? true
                : category.id === 'analytics'
                ? analyticsEnabled
                : marketingEnabled;

              const isExpanded = expandedCategories[category.id];

              return (
                <div
                  key={category.id}
                  className="border border-outline-variant/70 rounded-xl p-4 bg-surface/50 hover:bg-surface transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-on-surface">{category.name}</span>
                        {category.required ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <ShieldCheck size={12} />
                            Siempre activas
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-container text-secondary">
                            Opcional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary leading-relaxed">{category.description}</p>
                    </div>

                    {/* Switch */}
                    <div className="shrink-0 pt-0.5">
                      {category.required ? (
                        <div
                          className="w-12 h-6 bg-primary/40 rounded-full flex items-center px-1 cursor-not-allowed opacity-80"
                          title="Esta categoría es obligatoria"
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-xs transform translate-x-6 flex items-center justify-center">
                            <Check size={10} className="text-primary" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          aria-label={`Activar o desactivar ${category.name}`}
                          onClick={() => {
                            if (category.id === 'analytics') {
                              setAnalyticsEnabled((prev) => !prev);
                            } else if (category.id === 'marketing') {
                              setMarketingEnabled((prev) => !prev);
                            }
                          }}
                          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 focus:ring-2 focus:ring-primary focus:outline-hidden ${
                            isChecked ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${
                              isChecked ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detalle desplegable de cookies */}
                  <div className="mt-3 pt-3 border-t border-outline-variant/40">
                    <button
                      type="button"
                      onClick={() => toggleCategoryDetails(category.id)}
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 focus:outline-hidden"
                    >
                      <span>{isExpanded ? 'Ocultar detalle de cookies' : 'Ver detalle de cookies'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-xs bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50">
                        {category.cookies.map((cookie) => (
                          <div key={cookie.name} className="py-1 border-b last:border-0 border-outline-variant/30">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <code className="font-mono text-primary font-semibold">{cookie.name}</code>
                              <span className="text-[11px] text-secondary font-medium">
                                Proveedor: {cookie.provider} | Caducidad: {cookie.duration}
                              </span>
                            </div>
                            <p className="text-secondary mt-0.5">{cookie.purpose}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-6 py-4 bg-surface-container-low border-t border-outline-variant/60">
          <button
            type="button"
            onClick={rejectNonEssential}
            className="px-4 py-2 text-xs font-semibold text-on-surface bg-surface border border-outline-variant hover:bg-surface-container rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            Rechazar no esenciales
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              Guardar preferencias
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs rounded-xl transition-colors focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
