import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AccommodationListing } from '../../../housing/types/listing.types';
import { CopyIdButton } from '../common/CopyIdButton';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import {
  X,
  Home,
  MapPin,
  Euro,
  User,
  Ban,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface AdminListingDetailModalProps {
  listing: AccommodationListing | null;
  isOpen: boolean;
  onClose: () => void;
  onBan: (id: string) => Promise<void>;
  onUnban: (id: string) => Promise<void>;
  onRecover: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
  onInspectUser?: (userId: string) => void;
}

export const AdminListingDetailModal: React.FC<AdminListingDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onBan,
  onUnban,
  onRecover,
  onHardDelete,
  onInspectUser,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-app Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'BAN' | 'HARD_DELETE' | 'UNBAN';
    title: string;
    message: string;
    confirmText: string;
    variant: 'warning' | 'danger';
  } | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing && !confirmModal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, confirmModal, onClose]);

  if (!isOpen || !listing || typeof document === 'undefined') return null;

  const handleOpenBanConfirm = () => {
    setConfirmModal({
      type: 'BAN',
      title: '¿Confirmar suspensión / baneo de este anuncio?',
      message: 'Esta acción ocultará el anuncio inmediatamente de la plataforma y de los resultados de búsqueda.',
      confirmText: 'Sí, banear anuncio',
      variant: 'warning',
    });
  };

  const handleOpenUnbanConfirm = () => {
    setConfirmModal({
      type: 'UNBAN',
      title: '¿Confirmar desbaneo de este anuncio?',
      message: `Esta acción restaurará el anuncio "${listing.title}" haciéndolo visible y disponible nuevamente en las búsquedas públicas.`,
      confirmText: 'Sí, desbanear anuncio',
      variant: 'warning',
    });
  };

  const handleOpenHardDeleteConfirm = () => {
    setConfirmModal({
      type: 'HARD_DELETE',
      title: '¿Eliminar permanentemente este anuncio?',
      message: '¡ATENCIÓN! Esta acción ejecutará un borrado físico irreversible eliminando el anuncio de la base de datos.',
      confirmText: 'Sí, eliminar definitivamente',
      variant: 'danger',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      if (confirmModal.type === 'BAN') {
        await onBan(listing.id);
        setFeedback({ type: 'success', message: 'Anuncio baneado correctamente.' });
        setConfirmModal(null);
      } else if (confirmModal.type === 'UNBAN') {
        await onUnban(listing.id);
        setFeedback({ type: 'success', message: 'Anuncio desbaneado correctamente.' });
        setConfirmModal(null);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDelete(listing.id);
        setConfirmModal(null);
        onClose();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al ejecutar la acción.' });
      setConfirmModal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecover = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      await onRecover(listing.id);
      setFeedback({ type: 'success', message: 'Anuncio recuperado y restaurado con éxito.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al recuperar anuncio.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isBanned = listing.status === 'BANNED';
  const isDeleted = !!listing.deletedAt;

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={() => !isProcessing && onClose()}
      >
        <div
          className="w-full max-w-2xl lg:max-w-3xl max-h-[90vh] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Fijo) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <Home size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-on-surface truncate max-w-md">{listing.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                    isBanned ? 'bg-error-container text-error' :
                    isDeleted ? 'bg-surface-container text-secondary' :
                    listing.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {isDeleted ? 'Eliminado' : listing.status === 'AVAILABLE' ? 'Disponible' : listing.status === 'UNAVAILABLE' ? 'No disponible' : listing.status === 'BANNED' ? 'Baneado' : listing.status}
                  </span>
                </div>
                <div className="mt-0.5">
                  <CopyIdButton id={listing.id} prefix="ID:" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-error-container text-on-error-container border-error/20'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-error shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Body (Scrollable) */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Images Grid */}
            {((listing.selectedImages && listing.selectedImages.length > 0) || ((listing as any).images && (listing as any).images.length > 0)) && (
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-2">Galería de Imágenes</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(listing.selectedImages || (listing as any).images).map((img: any, idx: number) => (
                    <img
                      key={img.id || idx}
                      src={img.imageUrl || img.url}
                      alt={`${listing.title} ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-xl border border-outline-variant/60"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Key specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50 text-xs">
              <div>
                <span className="text-secondary block font-medium">Precio Mensual</span>
                <span className="text-sm font-bold text-primary flex items-center gap-1 mt-0.5">
                  <Euro size={15} />
                  {listing.pricePerMonth ?? (listing as any).price} €/mes
                </span>
              </div>
              <div>
                <span className="text-secondary block font-medium">Tipo Alquiler</span>
                <span className="text-sm font-bold text-on-surface mt-0.5 block">
                  {listing.rentalType === 'ROOM' ? 'Habitación' : 'Piso Completo'}
                </span>
              </div>
              <div>
                <span className="text-secondary block font-medium">Ciudad / Ubicación</span>
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-secondary" />
                  {typeof listing.accommodation?.city === 'string'
                    ? listing.accommodation.city
                    : typeof listing.accommodation?.address === 'string'
                    ? listing.accommodation.address
                    : (listing.accommodation?.address as any)?.city || 'No especificada'}
                </span>
              </div>
              <div>
                <span className="text-secondary block font-medium">Propietario / Host ID</span>
                <div className="mt-0.5">
                  {listing.hostId || (listing.accommodation as any)?.ownerId ? (
                    <CopyIdButton id={listing.hostId || (listing.accommodation as any)?.ownerId} truncate maxTruncateWidth="max-w-[100px]" />
                  ) : (
                    <span className="text-xs font-mono text-secondary">N/D</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">Descripción</span>
                <p className="text-xs text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Host Quick inspect */}
            {(listing.hostId || (listing.accommodation as any)?.ownerId) && onInspectUser && (
              <div className="flex items-center justify-between p-3.5 bg-tertiary-container/30 rounded-xl border border-tertiary/20">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-tertiary" />
                  <span className="text-xs font-semibold text-on-surface">Anfitrión / Propietario</span>
                </div>
                <button
                  onClick={() => onInspectUser(listing.hostId || (listing.accommodation as any)?.ownerId)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Inspeccionar perfil de anfitrión
                </button>
              </div>
            )}
          </div>

          {/* Footer (Fijo) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant bg-surface shrink-0">
            <span className="text-xs text-secondary font-medium">Acciones de moderación:</span>
            <div className="flex items-center gap-2">
              {isBanned ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenUnbanConfirm}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Desbanear Anuncio</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenBanConfirm}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Ban size={14} />
                  <span>Banear Anuncio</span>
                </button>
              )}

              {isDeleted && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRecover}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RotateCcw size={14} />
                  <span>Recuperar Anuncio</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleOpenHardDeleteConfirm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-error hover:bg-error/90 text-on-error rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Trash2 size={14} />
                <span>Borrado Físico</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <AdminConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onClose={() => !isProcessing && setConfirmModal(null)}
        />
      )}
    </>,
    document.body
  );
};
