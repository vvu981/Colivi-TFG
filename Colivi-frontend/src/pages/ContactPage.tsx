import React, { useState } from 'react';
import { Mail, LifeBuoy, ShieldCheck, Clock, Copy, Check, Info } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';

interface ContactChannel {
  id: string;
  title: string;
  email: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: 'general',
    title: 'Atención General e Información',
    email: 'contacto@colivi.es',
    description:
      'Para consultas generales sobre el funcionamiento de la plataforma, dudas previas al registro, colaboraciones comunitarias o información institucional.',
    icon: Mail,
    badge: 'Consultas Generales',
  },
  {
    id: 'support',
    title: 'Soporte Técnico y Convivencia',
    email: 'soporte@colivi.es',
    description:
      'Para incidencias técnicas en el uso de la web, problemas de acceso, dudas con la gestión de alojamientos o reporte de errores del sistema.',
    icon: LifeBuoy,
    badge: 'Soporte Técnico',
  },
  {
    id: 'privacy',
    title: 'Privacidad y Protección de Datos (DPO)',
    email: 'privacy@colivi.es',
    description:
      'Canal formal y exclusivo para el ejercicio de tus derechos ARCO/RGPD (acceso, rectificación, supresión, portabilidad) y consultas de privacidad.',
    icon: ShieldCheck,
    badge: 'RGPD / DPO',
  },
];

export const ContactPage: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = async (email: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      }
      setCopiedEmail(email);
      setTimeout(() => {
        setCopiedEmail((prev) => (prev === email ? null : prev));
      }, 2500);
    } catch (error) {
      console.error('Error al copiar correo al portapapeles:', error);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-margin-desktop py-8 sm:py-12 flex flex-col gap-10">
        {/* Cabecera Principal */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
            <Mail size={14} />
            <span>Canales Oficiales de Comunicación</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Contacto y Atención al Usuario
          </h1>
          <p className="text-sm sm:text-base text-secondary max-w-2xl leading-relaxed">
            En Colivi apostamos por una comunicación directa, transparente y sin intermediarios. Escríbenos directamente
            al correo correspondiente a tu consulta y nuestro equipo te responderá a la mayor brevedad.
          </p>
        </div>

        {/* Aviso de comunicación directa */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div className="text-xs sm:text-sm text-secondary leading-relaxed">
            <p className="font-semibold text-on-surface mb-0.5">Canales sin intermediación ni formularios</p>
            Para garantizar tu privacidad y evitar la retención innecesaria de datos en bases de datos intermedias, no
            disponemos de formularios web. Puedes enviarnos un correo directamente desde tu cliente de correo favorito.
          </div>
        </div>

        {/* Cuadrícula de Canales de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CONTACT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isCopied = copiedEmail === channel.email;

            return (
              <div
                key={channel.id}
                className="bg-surface-container-lowest text-on-surface border border-outline-variant/70 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container text-secondary">
                      {channel.badge}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-on-surface mb-2">{channel.title}</h2>
                  <p className="text-xs text-secondary leading-relaxed mb-6">{channel.description}</p>
                </div>

                <div className="pt-4 border-t border-outline-variant/40 space-y-3">
                  <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-semibold text-on-surface truncate">{channel.email}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(channel.email)}
                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors shrink-0 focus:ring-2 focus:ring-primary focus:outline-hidden"
                      title="Copiar correo al portapapeles"
                      aria-label={`Copiar correo ${channel.email}`}
                    >
                      {isCopied ? (
                        <Check size={16} className="text-primary" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>

                  <a
                    href={`mailto:${channel.email}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                  >
                    <Mail size={14} />
                    <span>Redactar correo</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección de Horarios y Compromiso de Respuesta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <h3 className="text-sm font-bold text-on-surface">Horario y Tiempos de Respuesta</h3>
            </div>
            <ul className="text-xs text-secondary space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Horario de atención:</span>
                <span>Lunes a Viernes, de 09:00 a 18:00 CET (excepto festivos).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Tiempo estimado:</span>
                <span>Respuestas en un plazo máximo de 24 a 48 horas laborables.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Urgencias de cuenta:</span>
                <span>Las solicitudes de suspensión o bloqueo preventivo se priorizan inmediatamente.</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Info size={18} />
              </div>
              <h3 className="text-sm font-bold text-on-surface">Información Legal de la Plataforma</h3>
            </div>
            <ul className="text-xs text-secondary space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Titular:</span>
                <span>Colivi Platform (Proyecto Universitario de Fin de Grado).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Jurisdicción:</span>
                <span>España, Unión Europea.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-on-surface min-w-[120px]">Cumplimiento:</span>
                <span>Conforme al Art. 10 de la Ley 34/2002 (LSSI-CE) y RGPD (UE 2016/679).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
