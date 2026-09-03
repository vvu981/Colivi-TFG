import React, { useState } from 'react';
import type { HomeDetailResponseDto, ExpenseResponseDto } from '../types';
import { useHomeExpenses } from '../hooks/useHomeExpenses';
import { ExpenseSummaryCards } from './ExpenseSummaryCards';
import { ExpenseBalancesList } from './ExpenseBalancesList';
import { ExpenseList } from './ExpenseList';
import { CreateExpenseModal } from './CreateExpenseModal';
import { ConfirmDeleteExpenseModal } from './ConfirmDeleteExpenseModal';
import { Spinner } from '../../../components/feedback/Spinner';
import { PlusCircle, RefreshCw } from 'lucide-react';

interface HomeExpensesTabProps {
  home: HomeDetailResponseDto;
  isAdmin: boolean;
  isActiveMember: boolean;
  currentUserId?: string;
}

export const HomeExpensesTab: React.FC<HomeExpensesTabProps> = ({
  home,
  isAdmin,
  isActiveMember,
  currentUserId,
}) => {
  const {
    expenses,
    balances,
    transfers,
    myBalance,
    totalExpensesAmount,
    isLoading,
    error,
    refetch,
    createExpense,
    deleteExpense,
  } = useHomeExpenses(home.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseResponseDto | null>(null);

  const activeMembers = home.members.filter((m) => m.status === 'ACTIVE');

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container/20 border border-error/20 rounded-2xl text-center space-y-3">
        <p className="text-xs text-error font-medium">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline-variant/60 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra Superior con Botón de Nuevo Gasto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Gastos Compartidos</h2>
          <p className="text-xs text-secondary">
            Control de cuentas, repartos por porcentaje o importe y liquidación de deudas.
          </p>
        </div>

        {isActiveMember && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Añadir Gasto</span>
          </button>
        )}
      </div>

      {/* Tarjetas Resumen */}
      <ExpenseSummaryCards
        myBalance={myBalance}
        totalExpensesAmount={totalExpensesAmount}
        expensesCount={expenses.length}
      />

      {/* Layout de 2 Columnas: Gastos (Izquierda) vs Balances y Transferencias (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Historial de Gastos (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Historial de Gastos</h3>
            <span className="text-xs text-secondary">{expenses.length} registrados</span>
          </div>

          <ExpenseList
            expenses={expenses}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onDeleteExpense={(exp) => setExpenseToDelete(exp)}
          />
        </div>

        {/* Columna Derecha: Balances y Transferencias Optimizadas (5 cols) */}
        <div className="lg:col-span-5">
          <ExpenseBalancesList
            balances={balances}
            transfers={transfers}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Modales */}
      <CreateExpenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        activeMembers={activeMembers}
        currentUserId={currentUserId}
        onCreateExpense={createExpense}
      />

      <ConfirmDeleteExpenseModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        expense={expenseToDelete}
        onConfirmDelete={deleteExpense}
      />
    </div>
  );
};
