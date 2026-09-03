import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, Receipt, CreditCard } from 'lucide-react';

interface ExpenseSummaryCardsProps {
  myBalance: number;
  totalExpensesAmount: number;
  expensesCount: number;
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({
  myBalance,
  totalExpensesAmount,
  expensesCount,
}) => {
  const isPositive = myBalance > 0;
  const isNegative = myBalance < 0;
  const isNeutral = myBalance === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Tarjeta de Balance Personal */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-secondary">Tu balance personal</span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600'
                : isNegative
                ? 'bg-error-container text-error'
                : 'bg-surface-container text-secondary'
            }`}
          >
            {isPositive && <TrendingUp className="w-4 h-4" />}
            {isNegative && <TrendingDown className="w-4 h-4" />}
            {isNeutral && <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
        <div>
          <div
            className={`text-2xl font-black tracking-tight ${
              isPositive ? 'text-emerald-700' : isNegative ? 'text-error' : 'text-on-surface'
            }`}
          >
            {isPositive ? `+${myBalance.toFixed(2)} €` : `${myBalance.toFixed(2)} €`}
          </div>
          <p className="text-[11px] text-secondary mt-1">
            {isPositive && 'Te deben dinero en el grupo'}
            {isNegative && 'Debes dinero a tus compañeros'}
            {isNeutral && 'Estás al día con todos los pagos'}
          </p>
        </div>
      </div>

      {/* Tarjeta de Gasto Total */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-secondary">Gasto total acumulado</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight text-on-surface">
            {totalExpensesAmount.toFixed(2)} €
          </div>
          <p className="text-[11px] text-secondary mt-1">Suma de todos los gastos registrados</p>
        </div>
      </div>

      {/* Tarjeta de Movimientos */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-secondary">Movimientos activos</span>
          <div className="w-8 h-8 rounded-full bg-surface-container text-secondary flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight text-on-surface">
            {expensesCount} {expensesCount === 1 ? 'gasto' : 'gastos'}
          </div>
          <p className="text-[11px] text-secondary mt-1">Registrados en la contabilidad del hogar</p>
        </div>
      </div>
    </div>
  );
};
