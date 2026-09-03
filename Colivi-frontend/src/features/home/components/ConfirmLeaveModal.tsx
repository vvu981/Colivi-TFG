import React, { useState, useEffect } from 'react';
import { LogOut, X, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ConfirmLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  isSoleActiveMember: boolean;
  isOnlyAdminWithOtherMembers: boolean;
  onConfirmLeave: () => Promise<void>;
  onOpenTransferAdmin: () => void;
}

export const ConfirmLeaveModal: React.FC<ConfirmLeaveModalProps> = ({
  isOpen,
  onClose,
  homeName,
  isSoleActiveMember,
  isOnlyAdminWithOtherMembers,
  onConfirmLeave,
  onOpenTransferAdmin,
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
      await onConfirmLeave();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al salir del hogar. Asegúrate de no tener balances pendientes.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-home-title"
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
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h2 id="leave-home-title" className="text-lg font-bold text-on-surface">Salir de {homeName}</h2>
            <p className="text-xs text-secondary">Confirmación de abandono de hogar</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        {isOnlyAdminWithOtherMembers ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Acción bloqueada</span>
              </div>
              <p>
                Eres el <strong>único administrador</strong> del hogar y aún quedan otros compañeros activos. Para evitar dejar el grupo huérfano, debes transferir el rol de administrador antes de salir.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransferAdmin();
                }}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
              >
                Transferir Administración
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isSoleActiveMember ? (
              <div className="p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Eliminación automática del hogar</span>
                </div>
                <p>
                  Eres el <strong>único miembro activo</strong> de este hogar. Al salir, el hogar será eliminado automáticamente para todos los miembros pasados.
                </p>
              </div>
            ) : (
              <p className="text-sm text-secondary">
                Tu estado pasará a <strong>Salido</strong>. Conservarás acceso de solo lectura al historial y auditoría en la pestaña "Salidos / Historial".
              </p>
            )}

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
                <span>Salir del Hogar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
