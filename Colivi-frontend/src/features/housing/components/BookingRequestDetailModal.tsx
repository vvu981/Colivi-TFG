import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  Euro,
  User,
  Mail,
  Home,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquareQuote,
  MapPin
} from 'lucide-react';
import type { BookingRequest } from '../types/booking.types';
import { StatusBadge } from './StatusBadge';
import { Button } from '../../../components/ui/Button';

interface BookingRequestDetailModalProps {
  request: BookingRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (request: BookingRequest) => void;
  onReject?: (request: BookingRequest) => void;
  isProcessing?: boolean;
}

export const BookingRequestDetailModal: React.FC<BookingRequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onAccept,
  onReject,
  isProcessing = false,
}) => {
  if (!isOpen || !request) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isPending = request.status === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-detail-title"
    >
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <h2 id="request-detail-title" className="text-title-lg md:text-headline-sm font-bold text-on-surface">
              Solicitud de Reserva
            </h2>
            <StatusBadge status={request.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Accommodation / Listing Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-variant shrink-0 border border-outline-variant/30">
              {request.listing?.coverImageUrl ? (
                <img
                  src={request.listing.coverImageUrl}
                  alt={request.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                  <Home size={28} />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Alojamiento</span>
              <h3 className="text-title-md font-bold text-on-surface truncate">
                {request.listing?.title || 'Alojamiento solicitado'}
              </h3>
              {request.listing?.address && (
                <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{request.listing.address}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
              <div className="flex items-center text-primary font-bold text-lg">
                <Euro size={18} />
                <span>{request.totalPrice}</span>
                <span className="text-xs text-on-surface-variant font-normal ml-1">/mes</span>
              </div>
              {request.listing?.id && (
                <Link
                  to={`/listings/${request.listing.id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver anuncio <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              {request.tenant?.profilePictureUrl ? (
                <img
                  src={request.tenant.profilePictureUrl}
                  alt="Inquilino"
                  className="w-13 h-13 rounded-full object-cover border-2 border-surface shadow-sm"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-lg border-2 border-surface shadow-sm">
                  <User size={26} />
                </div>
              )}
              <div>
                <p className="text-title-md font-bold text-on-surface leading-snug">
                  {request.tenant?.firstName} {request.tenant?.lastName}
                </p>
                <p className="text-xs text-on-surface-variant">Inquilino solicitante</p>
              </div>
            </div>

            {/* Direct Email Contact Link */}
            {request.tenant?.email && (
              <a
                href={`mailto:${request.tenant.email}?subject=Sobre tu solicitud de reserva en Colivi`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors shadow-xs"
              >
                <Mail size={14} />
                <span>{request.tenant.email}</span>
              </a>
            )}
          </div>

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-primary-container/20 border border-primary/15 flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Período de estancia
                </span>
                <span className="text-body-md font-bold text-on-surface">
                  {formatDate(request.startDate)} – {formatDate(request.endDate)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex items-center gap-3">
              <div className="p-2.5 bg-surface-container-high rounded-xl text-on-surface-variant shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Fecha de solicitud
                </span>
                <span className="text-body-md font-bold text-on-surface">
                  {formatDate(request.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant's Custom Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
              <MessageSquareQuote size={18} className="text-primary" />
              <span>Mensaje del inquilino</span>
            </div>
            {request.message && request.message.trim() ? (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50 text-body-md text-on-surface leading-relaxed italic">
                "{request.message}"
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-dashed border-outline-variant/60 text-body-sm text-on-surface-variant/70 italic">
                El inquilino no adjuntó un mensaje personalizado a esta solicitud.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between gap-3">
          <Button
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant/40 font-label-md transition-colors"
          >
            Cerrar
          </Button>

          {isPending && onAccept && onReject && (
            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => onReject(request)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-error/10 text-error hover:bg-error hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <XCircle size={16} />
                <span>Rechazar</span>
              </Button>
              <Button
                onClick={() => onAccept(request)}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#16a34a] text-white hover:bg-[#15803d] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#16a34a]/20 flex items-center gap-1.5"
              >
                <CheckCircle size={16} />
                <span>Aceptar solicitud</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
