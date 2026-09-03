import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '../api/expenseService';
import type {
  ExpenseResponseDto,
  BalanceResponseDto,
  DebtTransferResponseDto,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  RecordPaymentRequest,
  Page,
} from '../types';
import { useAuth } from '../../auth/context/AuthContext';

export interface UseHomeExpensesReturn {
  expenses: ExpenseResponseDto[];
  pageData: Page<ExpenseResponseDto> | null;
  balances: BalanceResponseDto[];
  transfers: DebtTransferResponseDto[];
  myBalance: number;
  totalExpensesAmount: number;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  payerFilter: string;
  typeFilter: 'ALL' | 'EXPENSES' | 'PAYMENTS';
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setPayerFilter: (payerId: string) => void;
  setTypeFilter: (type: 'ALL' | 'EXPENSES' | 'PAYMENTS') => void;
  refetch: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<ExpenseResponseDto>;
  updateExpense: (expenseId: string, data: UpdateExpenseRequest) => Promise<ExpenseResponseDto>;
  recordPayment: (data: RecordPaymentRequest) => Promise<ExpenseResponseDto>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

export const useHomeExpenses = (homeId?: string): UseHomeExpensesReturn => {
  const { user } = useAuth();
  const [pageData, setPageData] = useState<Page<ExpenseResponseDto> | null>(null);
  const [balances, setBalances] = useState<BalanceResponseDto[]>([]);
  const [transfers, setTransfers] = useState<DebtTransferResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y paginación
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [payerFilter, setPayerFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSES' | 'PAYMENTS'>('ALL');

  const fetchExpensesData = useCallback(async () => {
    if (!homeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const onlyPayments =
        typeFilter === 'EXPENSES' ? false : typeFilter === 'PAYMENTS' ? true : undefined;

      const [expensesPage, balancesData, transfersData] = await Promise.all([
        expenseService.getHomeExpenses(homeId, {
          search: searchQuery.trim() || undefined,
          payerId: payerFilter || undefined,
          onlyPayments,
          page: currentPage,
          size: 10,
        }),
        expenseService.getHomeBalances(homeId),
        expenseService.getOptimizedTransfers(homeId),
      ]);
      setPageData(expensesPage);
      setBalances(balancesData);
      setTransfers(transfersData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los gastos del hogar';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [homeId, currentPage, searchQuery, payerFilter, typeFilter]);

  useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  // Al cambiar filtros, reseteamos a la primera página (0)
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  }, []);

  const handleSetPayerFilter = useCallback((payerId: string) => {
    setPayerFilter(payerId);
    setCurrentPage(0);
  }, []);

  const handleSetTypeFilter = useCallback((type: 'ALL' | 'EXPENSES' | 'PAYMENTS') => {
    setTypeFilter(type);
    setCurrentPage(0);
  }, []);

  const createExpense = useCallback(
    async (data: CreateExpenseRequest): Promise<ExpenseResponseDto> => {
      if (!homeId) throw new Error('Identificador de hogar no válido');
      const created = await expenseService.createExpense(homeId, data);
      await fetchExpensesData();
      return created;
    },
    [homeId, fetchExpensesData]
  );

  const updateExpense = useCallback(
    async (expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseResponseDto> => {
      if (!homeId) throw new Error('Identificador de hogar no válido');
      const updated = await expenseService.updateExpense(homeId, expenseId, data);
      await fetchExpensesData();
      return updated;
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

  const expenses = useMemo(() => pageData?.content ?? [], [pageData]);
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.isPayment ? 0 : curr.totalAmount), 0);
  }, [expenses]);

  return {
    expenses,
    pageData,
    balances,
    transfers,
    myBalance,
    totalExpensesAmount,
    totalElements,
    totalPages,
    currentPage,
    searchQuery,
    payerFilter,
    typeFilter,
    isLoading,
    error,
    setPage: setCurrentPage,
    setSearchQuery: handleSetSearchQuery,
    setPayerFilter: handleSetPayerFilter,
    setTypeFilter: handleSetTypeFilter,
    refetch: fetchExpensesData,
    createExpense,
    updateExpense,
    recordPayment,
    deleteExpense,
  };
};
