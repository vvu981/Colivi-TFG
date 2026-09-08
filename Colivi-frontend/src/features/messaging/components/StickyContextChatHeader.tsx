import React from 'react';
import type { ConversationSummary } from '../types';

interface StickyContextChatHeaderProps {
  conversation: ConversationSummary;
  onRequestBooking: () => void;
  onArchiveToggle: () => void;
  onReportUser: () => void;
  isArchiving?: boolean;
}

export const StickyContextChatHeader: React.FC<StickyContextChatHeaderProps> = ({
  conversation,
  onRequestBooking,
  onArchiveToggle,
  onReportUser,
  isArchiving = false,
}) => {
  const getStatusBadge = () => {
    switch (conversation.bookingStatus) {
      case 'CONSULTATION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant border border-outline-variant">
            Consulta Abierta
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-container text-on-primary-container">
            Reserva Pendiente
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
            Reserva Aceptada
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tertiary-container text-on-tertiary-container">
            Reserva Confirmada
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
            Reserva Rechazada
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
            Reserva Cancelada
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
            Reserva Caducada
          </span>
        );
      default:
        return null;
    }
  };

  const showBookingCta = !conversation.isHost && conversation.bookingStatus === 'CONSULTATION';

  return (
    <header className="sticky top-0 z-20 w-full bg-surface/95 backdrop-blur-md border-b border-outline-variant shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Ficha del Alojamiento */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-outline-variant">
            {conversation.listingThumbnailUrl ? (
              <img
                src={conversation.listingThumbnailUrl}
                alt={conversation.listingTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-on-surface truncate">
                {conversation.listingTitle}
              </h2>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5">
              <span className="font-semibold text-on-surface">
                {conversation.listingPricePerMonth.toLocaleString('es-ES')} €/mes
              </span>
              {conversation.bookingStartDate && conversation.bookingEndDate && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span>
                    {conversation.bookingStartDate} al {conversation.bookingEndDate}
                  </span>
                </>
              )}
              <span className="text-outline-variant">•</span>
              <span>
                Interlocutor: <strong className="text-on-surface">{conversation.interlocutorName}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Acciones de Conversión y Control */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Botón Prominente Permanente para Inquilino: Solicitar Reserva */}
          {showBookingCta && (
            <button
              type="button"
              onClick={onRequestBooking}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-on-primary bg-primary hover:opacity-90 active:opacity-100 rounded-lg shadow-xs transition-opacity focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Solicitar Reserva
            </button>
          )}

          {/* Control de Archivado para Inquilino y Anfitrión */}
          <button
            type="button"
            onClick={onArchiveToggle}
            disabled={isArchiving}
            title={conversation.isArchived ? 'Desarchivar conversación' : 'Ocultar chat del Inbox'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant transition-colors focus:outline-hidden disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            {conversation.isArchived ? 'Desarchivar' : 'Archivar Consulta'}
          </button>

          {/* Opción de Seguridad: Reportar Conversación o Badge si ya está reportada */}
          {conversation.isReported ? (
            <span
              title="Esta conversación ya ha sido denunciada"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-default select-none"
            >
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
              <span className="hidden sm:inline">Denunciada</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onReportUser}
              title="Denunciar conversación a moderación"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors focus:outline-hidden cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
              <span className="hidden sm:inline">Denunciar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
