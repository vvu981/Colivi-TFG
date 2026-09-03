import React, { useState } from 'react';
import type { ExpenseResponseDto } from '../types';
import {
  Receipt,
  Calendar,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react';
import { formatUserDisplayName, getUserInitial } from '../utils/userDisplay';

interface ExpenseListProps {
  expenses: ExpenseResponseDto[];
  currentUserId?: string;
  isAdmin?: boolean;
  onDeleteExpense: (expense: ExpenseResponseDto) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentUserId,
  isAdmin = false,
  onDeleteExpense,
}) => {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const toggleExpand = (expenseId: string) => {
    setExpandedExpenseId((prev) => (prev === expenseId ? null : expenseId));
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-surface text-secondary mx-auto flex items-center justify-center mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-on-surface mb-1">Sin gastos registrados</h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          Añade el primer gasto para empezar a gestionar las cuentas compartidas y balances de este hogar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const isExpanded = expandedExpenseId === expense.id;
        const isPayer = expense.payer.id === currentUserId;
        const canDelete = isPayer || isAdmin;
        const date = new Date(expense.createdAt);
        const isPayment = Boolean(expense.isPayment);
        const receiver = isPayment && expense.participants.length > 0 ? expense.participants[0].user : null;
        const isReceiver = receiver?.id === currentUserId;

        return (
          <div
            key={expense.id}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden hover:border-outline-variant transition-all shadow-2xs"
          >
            {/* Fila Principal del Gasto */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isPayment
                      ? 'bg-teal-500/10 text-teal-700'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isPayment ? (
                    <ArrowRightLeft className="w-5 h-5" />
                  ) : (
                    <Receipt className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-on-surface truncate">
                      {expense.description}
                    </h4>
                    {isPayment && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-700 border border-teal-500/20">
                        <ArrowRightLeft className="w-3 h-3" />
                        Pago directo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {isPayment ? 'De:' : 'Pagado por:'}{' '}
                      <strong className="text-on-surface">
                        {formatUserDisplayName(expense.payer)}
                        {isPayer && ' (Tú)'}
                      </strong>
                    </span>
                    {isPayment && receiver && (
                      <>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          Para:{' '}
                          <strong className="text-on-surface">
                            {formatUserDisplayName(receiver)}
                            {isReceiver && ' (Tú)'}
                          </strong>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {!isPayment && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {expense.participants.length}{' '}
                          {expense.participants.length === 1 ? 'participante' : 'participantes'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Importe y Acciones */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
                <div className="text-right">
                  <span className="text-base font-black text-on-surface">
                    {expense.totalAmount.toFixed(2)} €
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(expense.id)}
                    className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface rounded-lg transition-colors flex items-center gap-1 text-xs"
                    aria-expanded={isExpanded}
                    aria-label="Ver reparto detallado"
                  >
                    <span className="hidden sm:inline font-medium text-[11px]">
                      {isExpanded ? 'Ocultar' : 'Reparto'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(expense)}
                      className="p-1.5 text-secondary hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                      title="Eliminar gasto"
                      aria-label="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desglose Expandible de Participantes */}
            {isExpanded && (
              <div className="bg-surface/50 border-t border-outline-variant/40 p-4 sm:p-5">
                <div className="mb-2.5">
                  <span className="text-xs font-bold text-on-surface">
                    Desglose de correspondencias individuales:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {expense.participants.map((p) => {
                    const isCurrentParticipant = p.user?.id === currentUserId;
                    const participantName = formatUserDisplayName(p.user);
                    const participantInitial = getUserInitial(participantName);
                    const percentage =
                      expense.totalAmount > 0
                        ? Math.round((p.owedAmount / expense.totalAmount) * 10000) / 100
                        : 0;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {p.user?.profilePicUrl ? (
                            <img
                              src={p.user.profilePicUrl}
                              alt={participantName}
                              className="w-6 h-6 rounded-full object-cover border border-outline-variant/40 shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                              {participantInitial}
                            </div>
                          )}
                          <span className="font-semibold text-on-surface truncate">
                            {participantName}
                            {isCurrentParticipant && ' (Tú)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-medium text-secondary bg-surface-container px-1.5 py-0.5 rounded">
                            {percentage}%
                          </span>
                          <span className="font-bold text-on-surface">
                            {p.owedAmount.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
