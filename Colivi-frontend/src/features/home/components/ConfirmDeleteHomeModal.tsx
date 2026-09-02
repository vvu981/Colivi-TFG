import React, { useState } from 'react';
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  onConfirmDelete: () => Promise<void>;
}

export const ConfirmDeleteHomeModal: React.FC<ConfirmDeleteHomeModalProps> = ({
  isOpen,
  onClose,
  homeName,
  onConfirmDelete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al eliminar el hogar. Solo puedes eliminarlo si eres el único miembro activo.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
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
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Eliminar Hogar</h2>
            <p className="text-xs text-secondary">{homeName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-error-container/30 border border-error/20 rounded-xl text-xs text-error space-y-1.5 mb-5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Acción irreversible</span>
          </div>
          <p>
            Esta acción eliminará el hogar y todos sus registros asociados. Solo puedes realizar esta acción si eres administrador y no hay otros miembros activos.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-error text-white text-sm font-semibold rounded-xl hover:bg-error/90 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Eliminar Hogar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
