import React from 'react';
import { Cookie, Settings, ShieldCheck, HelpCircle, Sliders, ExternalLink } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { useCookieConsent } from '../features/compliance';
import { COOKIE_DEFINITIONS } from '../features/compliance';

export const CookiesPage: React.FC = () => {
  const { openPreferencesModal, preferences } = useCookieConsent();

  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-margin-desktop py-8 sm:py-12 flex flex-col gap-8">
        {/* Encabezado */}
        <div className="space-y-3 border-b border-outline-variant/60 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Cookie size={14} />
            <span>Transparencia y Rastreadores</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Política de Cookies y Tecnologías Similares
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Conforme a la Ley 34/2002 (LSSI-CE), Directiva ePrivacy 2002/58/CE y Guía sobre el uso de cookies de la AEPD.
          </p>
        </div>

        {/* Panel de Configuración Rápida */}
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders size={18} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">Gestión Activa de Preferencias</h2>
            </div>
            <p className="text-xs text-secondary leading-relaxed max-w-lg">
              Puedes modificar o revocar tu consentimiento en cualquier momento. Tu estado actual:{' '}
              <span className="font-semibold text-on-surface">
                {preferences ? (
                  preferences.analytics && preferences.marketing
                    ? 'Todas las categorías aceptadas'
                    : preferences.analytics
                    ? 'Técnicas y Analíticas aceptadas'
                    : preferences.marketing
                    ? 'Técnicas y Personalización aceptadas'
                    : 'Solo cookies técnicas necesarias'
                ) : (
                  'Pendiente de configurar'
                )}
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={openPreferencesModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs shrink-0 focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <Settings size={15} />
            <span>Configurar cookies</span>
          </button>
        </div>

        {/* Contenido */}
        <article className="space-y-8 text-sm text-secondary leading-relaxed">
          {/* 1. ¿Qué son las cookies? */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <HelpCircle size={18} className="text-primary" />
              <h2 className="text-lg font-bold">1. ¿Qué son las Cookies?</h2>
            </div>
            <p>
              Una cookie es un pequeño fichero de texto que un sitio web almacena en el navegador del usuario al acceder a
              determinadas páginas. Su finalidad es recordar información técnica sobre la visita (como el idioma preferido,
              el identificador de sesión activa o parámetros de visualización) para hacer más fluida y segura la experiencia
              de navegación.
            </p>
            <p>
              En Colivi utilizamos cookies y tecnologías de almacenamiento local en el navegador (como{' '}
              <code className="font-mono text-primary font-semibold">localStorage</code>) para garantizar el funcionamiento
              técnico de la plataforma y, en su caso, analizar el rendimiento del servicio de forma anónima.
            </p>
          </section>

          {/* 2. Categorías de cookies en Colivi */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <ShieldCheck size={18} className="text-primary" />
              <h2 className="text-lg font-bold">2. Categorías de Cookies Empleadas</h2>
            </div>
            <p>
              De acuerdo con las directrices de la Agencia Española de Protección de Datos (AEPD), clasificamos nuestras
              cookies según su finalidad:
            </p>

            <div className="space-y-4 pt-2">
              {COOKIE_DEFINITIONS.map((category) => (
                <div key={category.id} className="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-lowest">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-on-surface text-sm">{category.name}</h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        category.required ? 'bg-primary/10 text-primary' : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {category.required ? 'Obligatoria' : 'Opcional (Requiere Consentimiento)'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mb-3">{category.description}</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-outline-variant/40 rounded-lg overflow-hidden">
                      <thead className="bg-surface-container-low text-on-surface font-semibold">
                        <tr>
                          <th className="p-2.5 border-b border-outline-variant/40">Nombre</th>
                          <th className="p-2.5 border-b border-outline-variant/40">Proveedor</th>
                          <th className="p-2.5 border-b border-outline-variant/40">Finalidad</th>
                          <th className="p-2.5 border-b border-outline-variant/40">Caducidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.cookies.map((cookie) => (
                          <tr key={cookie.name} className="border-b last:border-0 border-outline-variant/30">
                            <td className="p-2.5 font-mono text-primary font-semibold">{cookie.name}</td>
                            <td className="p-2.5">{cookie.provider}</td>
                            <td className="p-2.5">{cookie.purpose}</td>
                            <td className="p-2.5">{cookie.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Bloqueo previo (Opt-in) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <ShieldCheck size={18} className="text-primary" />
              <h2 className="text-lg font-bold">3. Bloqueo Previo y Principio de Consentimiento Explícito</h2>
            </div>
            <p>
              Cumpliendo estrictamente con el principio de privacidad por defecto (Privacy by Default), Colivi{' '}
              <strong>bloquea la ejecución de cualquier script o cookie no esencial</strong> hasta que el usuario manifieste
              su consentimiento inequívoco mediante una acción afirmativa ("Aceptar todas" o activando la categoría deseada y
              pulsando "Guardar preferencias").
            </p>
          </section>

          {/* 4. Gestión a través del navegador */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Settings size={18} className="text-primary" />
              <h2 className="text-lg font-bold">4. Deshabilitación de Cookies desde la Configuración de tu Navegador</h2>
            </div>
            <p>
              Además de nuestro panel de configuración, puedes permitir, bloquear o eliminar las cookies instaladas en tu
              equipo mediante las opciones de tu navegador:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Google Chrome <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Mozilla Firefox <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Apple Safari <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Microsoft Edge <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </MainLayout>
  );
};
