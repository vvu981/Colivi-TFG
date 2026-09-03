import React, { useState } from 'react';
import type { ExpenseResponseDto } from '../types';
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  User,
  Users,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: ExpenseResponseDto[];
  currentUserId?: string;
  isAdmin: boolean;
  onDeleteExpense: (expense: ExpenseResponseDto) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentUserId,
  isAdmin,
  onDeleteExpense,
}) => {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedExpenseId((prev) => (prev === id ? null : id));
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-10 text-center shadow-2xs">
        <Receipt className="w-10 h-10 text-secondary/40 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-on-surface">No hay gastos registrados</h3>
        <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
          Los gastos compartidos añadidos por los miembros del hogar aparecerán aquí desglosados con
          sus participantes y cuotas correspondientes.
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

        return (
          <div
            key={expense.id}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden hover:border-outline-variant transition-all shadow-2xs"
          >
            {/* Fila Principal del Gasto */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    {expense.description}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Pagado por:{' '}
                      <strong className="text-on-surface">
                        {expense.payer.firstName} {expense.payer.lastName1}
                        {isPayer && ' (Tú)'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {expense.participants.length}{' '}
                      {expense.participants.length === 1 ? 'participante' : 'participantes'}
                    </span>
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
                    const isCurrentParticipant = p.user.id === currentUserId;
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
                          {p.user.profilePicUrl ? (
                            <img
                              src={p.user.profilePicUrl}
                              alt={p.user.firstName}
                              className="w-6 h-6 rounded-full object-cover border border-outline-variant/40 shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                              {p.user.firstName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-on-surface truncate">
                            {p.user.firstName} {p.user.lastName1}
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
