import React from 'react';
import type { BalanceResponseDto, DebtTransferResponseDto } from '../types';
import { ArrowRight, ArrowRightLeft, UserCheck, Sparkles } from 'lucide-react';
import { formatUserDisplayName, getUserInitial } from '../utils/userDisplay';

interface ExpenseBalancesListProps {
  balances: BalanceResponseDto[];
  transfers: DebtTransferResponseDto[];
  currentUserId?: string;
  onSettleTransfer?: (fromUserId: string, toUserId: string, amount: number) => void;
}

export const ExpenseBalancesList: React.FC<ExpenseBalancesListProps> = ({
  balances,
  transfers,
  currentUserId,
  onSettleTransfer,
}) => {
  return (
    <div className="space-y-6">
      {/* Listado de Balances por Miembro */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Balances del Hogar</h3>
            <p className="text-[11px] text-secondary">
              Situación contable global de cada conviviente.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-secondary font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> A favor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-error inline-block" /> En contra
            </span>
          </div>
        </div>

        {balances.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary bg-surface rounded-2xl border border-outline-variant/40">
            No hay saldos pendientes registrados. Todos los convivientes están al día.
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((b, idx) => {
              const rawAmount = b.amount !== undefined ? b.amount : (b.balance ?? 0);
              const amount =
                typeof rawAmount === 'number'
                  ? rawAmount
                  : parseFloat(rawAmount as unknown as string) || 0;
              const isPositive = amount > 0;
              const isNegative = amount < 0;
              const userId = b.user?.id || b.userId || `balance-user-${idx}`;
              const isCurrentUser = Boolean(currentUserId && userId === currentUserId);
              const fullName = formatUserDisplayName(b.user, b.fullName);
              const initial = getUserInitial(fullName);
              const profilePicUrl = b.user?.profilePicUrl || b.profilePicUrl;

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-outline-variant/40 hover:border-outline-variant transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {profilePicUrl ? (
                      <img
                        src={profilePicUrl}
                        alt={fullName}
                        className="w-9 h-9 rounded-full object-cover border border-outline-variant/60 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {fullName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-secondary/10 text-secondary rounded">
                            Tú
                          </span>
                        )}
                      </div>
                      {/* Círculo indicador exigido por la especificación debajo del nombre */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isPositive
                              ? 'bg-emerald-500 shadow-2xs shadow-emerald-500/50'
                              : isNegative
                              ? 'bg-error shadow-2xs shadow-error/50'
                              : 'bg-outline-variant'
                          }`}
                          aria-label={
                            isPositive
                              ? 'Balance positivo (le deben dinero)'
                              : isNegative
                              ? 'Balance negativo (debe dinero)'
                              : 'Balance neutro'
                          }
                        />
                        <span className="text-[10px] text-secondary truncate">
                          {isPositive && 'Le deben al miembro'}
                          {isNegative && 'Debe al grupo'}
                          {!isPositive && !isNegative && 'Al corriente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        isPositive
                          ? 'text-emerald-700'
                          : isNegative
                          ? 'text-error'
                          : 'text-on-surface'
                      }`}
                    >
                      {isPositive ? `+${amount.toFixed(2)} €` : `${amount.toFixed(2)} €`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sugerencias de Transferencias Optimizadas */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Liquidación Eficiente de Cuentas</h3>
            <p className="text-[11px] text-secondary">
              Transferencias sugeridas para saldar todas las deudas con los mínimos pagos.
            </p>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary bg-surface rounded-2xl border border-outline-variant/40 flex flex-col items-center gap-1.5">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold text-on-surface">Cuentas completamente saneadas</span>
            <span>No se requiere ninguna transferencia entre convivientes.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t, idx) => {
              const fromUserId = t.fromUser?.id || t.fromUserId || `from-${idx}`;
              const toUserId = t.toUser?.id || t.toUserId || `to-${idx}`;
              const isCurrentUserSender = Boolean(currentUserId && fromUserId === currentUserId);
              const isCurrentUserReceiver = Boolean(currentUserId && toUserId === currentUserId);
              const fromName = formatUserDisplayName(t.fromUser, t.fromUserFullName);
              const toName = formatUserDisplayName(t.toUser, t.toUserFullName);
              const rawAmount = t.amount ?? 0;
              const amount =
                typeof rawAmount === 'number'
                  ? rawAmount
                  : parseFloat(rawAmount as unknown as string) || 0;

              return (
                <div
                  key={`${fromUserId}-${toUserId}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrentUserSender
                      ? 'bg-error-container/10 border-error/20'
                      : isCurrentUserReceiver
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-surface border-outline-variant/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 text-xs text-on-surface">
                    <span className="font-bold truncate max-w-[120px]">
                      {fromName}
                      {isCurrentUserSender && ' (Tú)'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="font-bold truncate max-w-[120px]">
                      {toName}
                      {isCurrentUserReceiver && ' (Tú)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
                      {amount.toFixed(2)} €
                    </span>
                    {onSettleTransfer && (
                      <button
                        type="button"
                        onClick={() => onSettleTransfer(fromUserId, toUserId, amount)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary hover:text-white hover:bg-primary rounded-xl transition-all border border-primary/30 cursor-pointer shadow-2xs active:scale-95"
                        title={`Registrar pago de ${fromName} a ${toName}`}
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Saldar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
