import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '../api/expenseService';
import type {
  ExpenseResponseDto,
  BalanceResponseDto,
  DebtTransferResponseDto,
  CreateExpenseRequest,
  RecordPaymentRequest,
} from '../types';
import { useAuth } from '../../auth/context/AuthContext';

interface UseHomeExpensesReturn {
  expenses: ExpenseResponseDto[];
  balances: BalanceResponseDto[];
  transfers: DebtTransferResponseDto[];
  myBalance: number;
  totalExpensesAmount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<ExpenseResponseDto>;
  recordPayment: (data: RecordPaymentRequest) => Promise<ExpenseResponseDto>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

export const useHomeExpenses = (homeId?: string): UseHomeExpensesReturn => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseResponseDto[]>([]);
  const [balances, setBalances] = useState<BalanceResponseDto[]>([]);
  const [transfers, setTransfers] = useState<DebtTransferResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpensesData = useCallback(async () => {
    if (!homeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [expensesData, balancesData, transfersData] = await Promise.all([
        expenseService.getHomeExpenses(homeId),
        expenseService.getHomeBalances(homeId),
        expenseService.getOptimizedTransfers(homeId),
      ]);
      setExpenses(expensesData);
      setBalances(balancesData);
      setTransfers(transfersData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los gastos del hogar';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [homeId]);

  useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  const createExpense = useCallback(
    async (data: CreateExpenseRequest): Promise<ExpenseResponseDto> => {
      if (!homeId) throw new Error('Identificador de hogar no válido');
      const created = await expenseService.createExpense(homeId, data);
      await fetchExpensesData();
      return created;
    },
    [homeId, fetchExpensesData]
  );

  const recordPayment = useCallback(
    async (data: RecordPaymentRequest): Promise<ExpenseResponseDto> => {
      if (!homeId) throw new Error('Identificador de hogar no válido');
      const created = await expenseService.recordPayment(homeId, data);
      await fetchExpensesData();
      return created;
    },
    [homeId, fetchExpensesData]
  );

  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      if (!homeId) throw new Error('Identificador de hogar no válido');
      await expenseService.deleteExpense(homeId, expenseId);
      await fetchExpensesData();
    },
    [homeId, fetchExpensesData]
  );

  const myBalance = useMemo(() => {
    if (!user) return 0;
    const found = balances.find((b) => (b.user?.id || b.userId) === user.id);
    if (!found) return 0;
    const raw = found.amount !== undefined ? found.amount : (found.balance ?? 0);
    return typeof raw === 'number' ? raw : parseFloat(raw as unknown as string) || 0;
  }, [balances, user]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [expenses]);

  return {
    expenses,
    balances,
    transfers,
    myBalance,
    totalExpensesAmount,
    isLoading,
    error,
    refetch: fetchExpensesData,
    createExpense,
    recordPayment,
    deleteExpense,
  };
};
