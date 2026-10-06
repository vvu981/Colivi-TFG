import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, X, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

export interface ConfirmDeleteAccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationAddress: string;
  accommodationId?: string;
  onConfirmDelete: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Confirmation dialog for soft-deleting an accommodation.
 * Single Responsibility: Modal presentation, accessibility, and user confirmation.
 */
export const ConfirmDeleteAccommodationModal: React.FC<ConfirmDeleteAccommodationModalProps> = ({
  isOpen,
  onClose,
  accommodationAddress,
  accommodationId,
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

  const hasActiveListingsError = Boolean(
    error && (error.toLowerCase().includes('anuncio') || error.toLowerCase().includes('activo'))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-accommodation-title"
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
            <h2 id="delete-accommodation-title" className="text-title-lg font-bold text-on-surface">
              Eliminar Alojamiento
            </h2>
            <p className="text-body-sm text-on-surface-variant truncate">{accommodationAddress}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-body-sm text-error font-medium">
            <p>{error}</p>
            {hasActiveListingsError && (
              <div className="mt-2 pt-2 border-t border-error/20 flex items-center justify-between">
                <span className="text-xs text-error/90">Gestiona tus publicaciones:</span>
                <Link
                  to={accommodationId ? `/my-listings#accommodation-${encodeURIComponent(accommodationId)}` : '/my-listings'}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
                >
                  <span>Ir a Mis Anuncios</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="p-3.5 bg-error-container/20 border border-error/20 rounded-xl text-body-sm text-error space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Consecuencias del borrado</span>
          </div>
          <p className="text-xs text-error/90 leading-relaxed">
            El inmueble dejará de estar disponible en tu panel y se eliminarán sus imágenes del servidor.
            Recuerda que no es posible eliminar un alojamiento si todavía cuenta con anuncios activos.
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
            <span>Eliminar alojamiento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
