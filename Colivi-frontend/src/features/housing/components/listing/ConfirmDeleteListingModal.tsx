import React, { useEffect } from 'react';
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

export interface ConfirmDeleteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle: string;
  onConfirmDelete: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Confirmation dialog for soft-deleting an accommodation listing.
 * Single Responsibility: Modal presentation, accessibility, and user confirmation.
 */
export const ConfirmDeleteListingModal: React.FC<ConfirmDeleteListingModalProps> = ({
  isOpen,
  onClose,
  listingTitle,
  onConfirmDelete,
  isLoading = false,
  error = null,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-listing-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id="delete-listing-title" className="text-title-lg font-bold text-on-surface">
              Eliminar Anuncio
            </h2>
            <p className="text-body-sm text-on-surface-variant truncate">{listingTitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-body-sm text-error font-medium">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-error-container/20 border border-error/20 rounded-xl text-body-sm text-error space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Retirada del catálogo público</span>
          </div>
          <p className="text-xs text-error/90 leading-relaxed">
            El anuncio dejará de estar visible en las búsquedas y el mapa. Los inquilinos no podrán enviar nuevas reservas para este anuncio.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-label-md font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-error text-white text-label-md font-semibold rounded-xl hover:bg-error/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Eliminar anuncio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
