import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, X, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { expenseService } from '../api/expenseService';

interface ConfirmLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  isSoleActiveMember: boolean;
  isOnlyAdminWithOtherMembers: boolean;
  userBalance?: number;
  homeId?: string;
  currentUserId?: string;
  onConfirmLeave: () => Promise<void>;
  onOpenTransferAdmin: () => void;
}

export const ConfirmLeaveModal: React.FC<ConfirmLeaveModalProps> = ({
  isOpen,
  onClose,
  homeName,
  isSoleActiveMember,
  isOnlyAdminWithOtherMembers,
  userBalance,
  homeId,
  currentUserId,
  onConfirmLeave,
  onOpenTransferAdmin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (userBalance !== undefined || !homeId || !currentUserId) return;
    setIsLoadingBalance(true);
    try {
      const balances = await expenseService.getHomeBalances(homeId);
      const found = balances.find((b) => (b.user?.id || b.userId) === currentUserId);
      const raw = found?.amount !== undefined ? found.amount : (found?.balance ?? 0);
      const num = typeof raw === 'number' ? raw : parseFloat(raw as unknown as string) || 0;
      setFetchedBalance(num);
    } catch {
      // Si falla, el backend de todos modos valida el balance
      setFetchedBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [userBalance, homeId, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchBalance();
  }, [isOpen, fetchBalance]);

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

  const effectiveBalance = userBalance !== undefined ? userBalance : (fetchedBalance ?? 0);
  const hasDebt = effectiveBalance < -0.005;
  const hasCredit = effectiveBalance > 0.005;
  const hasPendingBalance = hasDebt || hasCredit;

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
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
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

        {isLoadingBalance && (
          <div className="mb-4 p-2.5 bg-surface-container rounded-xl flex items-center gap-2 text-xs text-secondary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Comprobando saldo de gastos...</span>
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
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransferAdmin();
                }}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                Transferir Administración
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasDebt ? (
              <div className="p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span>Acción bloqueada: Deuda activa</span>
                </div>
                <p>
                  Tu balance actual es de <strong>-{Math.abs(effectiveBalance).toFixed(2)} €</strong>.
                  Para poder salir del hogar, debes saldar tus deudas con tus compañeros registrando el pago correspondiente en la pestaña de Gastos.
                </p>
              </div>
            ) : hasCredit ? (
              <div className="p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span>Acción bloqueada: Saldo a favor pendiente</span>
                </div>
                <p>
                  El grupo te debe <strong>+{effectiveBalance.toFixed(2)} €</strong>.
                  Para poder salir del hogar, debes recibir tus cobros pendientes o registrarlos como saldados en la pestaña de Gastos antes de salir.
                </p>
              </div>
            ) : isSoleActiveMember ? (
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
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || hasPendingBalance || isLoadingBalance}
                title={
                  hasDebt
                    ? 'Debes saldar tu deuda antes de poder salir'
                    : hasCredit
                    ? 'Debes saldar tus cobros pendientes antes de poder salir'
                    : undefined
                }
                className="flex items-center gap-2 px-5 py-2 bg-error text-white text-sm font-semibold rounded-xl hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
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
