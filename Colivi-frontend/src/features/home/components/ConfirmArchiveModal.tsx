import React, { useState, useEffect } from 'react';
import { Archive, X, Loader2, Info } from 'lucide-react';

interface ConfirmArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  onConfirmArchive: () => Promise<void>;
}

export const ConfirmArchiveModal: React.FC<ConfirmArchiveModalProps> = ({
  isOpen,
  onClose,
  homeName,
  onConfirmArchive,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmArchive();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al archivar el hogar. Inténtalo de nuevo.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-3xl border border-outline-variant max-w-md w-full p-6 sm:p-7 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 id="archive-modal-title" className="text-lg font-bold text-on-surface">¿Archivar hogar?</h2>
            <p className="text-xs text-secondary truncate max-w-[260px]">{homeName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-secondary leading-relaxed">
            ¿Estás seguro de que deseas archivar <strong>{homeName}</strong>? Se retirará de tu vista principal de historial para mantener tu espacio limpio.
          </p>

          <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl text-xs text-secondary space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Info className="w-4 h-4 shrink-0" />
              <span>¿Dónde podré ver este hogar?</span>
            </div>
            <p className="text-[11px] leading-normal">
              Podrás acceder a toda su información histórica de convivencia y desarchivarlo en cualquier momento desde el menú de tu perfil seleccionando <strong className="text-on-surface font-semibold">Hogares archivados</strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
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
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar y Archivar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
