import React, { useState, useEffect } from 'react';
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import type { ExpenseResponseDto } from '../types';

interface ConfirmDeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseResponseDto | null;
  onConfirmDelete: (expenseId: string) => Promise<void>;
}

export const ConfirmDeleteExpenseModal: React.FC<ConfirmDeleteExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !expense) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(expense.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el gasto';
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-expense-title"
    >
      <div className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Botón de Cierre */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 text-secondary hover:text-on-surface disabled:opacity-40 transition-colors p-1"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con Icono */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-error-container text-error flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="modal-delete-expense-title" className="text-lg font-bold text-on-surface">
              Eliminar Gasto
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Esta acción revertirá los saldos y no se puede deshacer.
            </p>
          </div>
        </div>

        {/* Información del gasto a borrar */}
        <div className="p-4 bg-surface rounded-2xl border border-outline-variant/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary font-medium">Concepto:</span>
            <span className="font-bold text-on-surface truncate max-w-[200px]">
              {expense.description}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary font-medium">Importe total:</span>
            <span className="font-bold text-primary">{expense.totalAmount.toFixed(2)} €</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary font-medium">Pagado por:</span>
            <span className="text-on-surface">
              {expense.payer.firstName} {expense.payer.lastName1}
            </span>
          </div>
        </div>

        {/* Aviso de auditoría */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            El borrado quedará registrado en el <strong>Feed de Auditoría</strong> del hogar para
            garantizar la total trazabilidad de las finanzas del grupo.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-error-container/20 border border-error/20 rounded-xl text-xs text-error">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-error text-white text-xs font-semibold rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50 shadow-xs"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar gasto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
