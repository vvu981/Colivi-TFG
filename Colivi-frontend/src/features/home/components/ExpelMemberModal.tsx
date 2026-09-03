import React, { useState, useEffect } from 'react';
import { UserMinus, X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { HomeMemberResponseDto } from '../types';

import { expenseService } from '../api/expenseService';

interface ExpelMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: HomeMemberResponseDto | null;
  homeId?: string;
  memberBalance?: number;
  onExpel: (userId: string) => Promise<void>;
  onForceExpel: (userId: string, reason?: string) => Promise<void>;
}

export const ExpelMemberModal: React.FC<ExpelMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  homeId,
  memberBalance,
  onExpel,
  onForceExpel,
}) => {
  const [isForceExpel, setIsForceExpel] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !member || memberBalance !== undefined || !homeId) return;
    expenseService
      .getHomeBalances(homeId)
      .then((balances) => {
        const found = balances.find((b) => (b.user?.id || b.userId) === member.userId);
        const raw = found?.amount !== undefined ? found.amount : (found?.balance ?? 0);
        const num = typeof raw === 'number' ? raw : parseFloat(raw as unknown as string) || 0;
        setFetchedBalance(num);
      })
      .catch(() => {
        setFetchedBalance(0);
      });
  }, [isOpen, member, homeId, memberBalance]);

  const effectiveBalance = memberBalance !== undefined ? memberBalance : fetchedBalance;

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

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isForceExpel) {
        await onForceExpel(member.userId, reason.trim() || undefined);
      } else {
        await onExpel(member.userId);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al expulsar al miembro. Si tiene deudas pendientes, prueba con la opción de expulsión forzosa.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expel-member-title"
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
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h2 id="expel-member-title" className="text-lg font-bold text-on-surface">Expulsar Miembro</h2>
            <p className="text-xs text-secondary">{member.fullName} ({member.email})</p>
          </div>
        </div>

        {/* Selector de tipo de expulsión */}
        <div className="flex rounded-xl bg-surface-container p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setIsForceExpel(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              !isForceExpel
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Estándar (Balance 0)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsForceExpel(true);
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              isForceExpel
                ? 'bg-surface text-error shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Forzosa (Con Deuda)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        {effectiveBalance !== null && (
          <div className="mb-4 p-2.5 bg-surface-container rounded-xl text-xs flex items-center justify-between">
            <span className="text-secondary font-medium">Balance actual de {member.fullName}:</span>
            <span
              className={`font-bold ${
                effectiveBalance > 0.005
                  ? 'text-emerald-700'
                  : effectiveBalance < -0.005
                  ? 'text-error'
                  : 'text-secondary'
              }`}
            >
              {effectiveBalance > 0.005
                ? `+${effectiveBalance.toFixed(2)} € (a favor)`
                : effectiveBalance < -0.005
                ? `-${Math.abs(effectiveBalance).toFixed(2)} € (debe dinero)`
                : '0.00 € (al corriente)'}
            </span>
          </div>
        )}

        {!isForceExpel ? (
          <div className="space-y-3 mb-5">
            <div className="p-3 bg-surface border border-outline-variant/60 rounded-xl text-xs text-secondary space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Condición requerida</span>
              </div>
              <p>
                La expulsión estándar requiere que <strong>{member.fullName}</strong> no tenga saldos pendientes a favor ni en contra en los gastos del hogar.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Liquidación compensatoria automática</span>
              </div>
              <p>
                Si el miembro debe dinero, su deuda será repartida y asumida equitativamente por los miembros restantes. Si se le debía dinero, la casa asume el saldo.
              </p>
            </div>

            <div>
              <label htmlFor="expelReason" className="block text-xs font-semibold text-on-surface mb-1">
                Motivo de la expulsión forzosa (opcional)
              </label>
              <input
                id="expelReason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Impago reiterado, abandono imprevisto..."
                maxLength={255}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-error text-white text-sm font-semibold rounded-xl hover:bg-error/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isForceExpel ? 'Forzar Expulsión' : 'Confirmar Expulsión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
