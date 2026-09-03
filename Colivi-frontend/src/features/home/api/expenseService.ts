import api from '../../../lib/api';
import type {
  ExpenseResponseDto,
  CreateExpenseRequest,
  BalanceResponseDto,
  DebtTransferResponseDto,
} from '../types';

export const expenseService = {
  /**
   * Obtiene la lista completa de gastos del hogar.
   */
  async getHomeExpenses(homeId: string): Promise<ExpenseResponseDto[]> {
    const response = await api.get<ExpenseResponseDto[]>(`/homes/${homeId}/expenses`);
    return response.data;
  },

  /**
   * Registra un nuevo gasto en el hogar con reparto equitativo o personalizado.
   */
  async createExpense(
    homeId: string,
    data: CreateExpenseRequest
  ): Promise<ExpenseResponseDto> {
    const response = await api.post<ExpenseResponseDto>(
      `/homes/${homeId}/expenses`,
      data
    );
    return response.data;
  },

  /**
   * Elimina un gasto existente (solo permitido al pagador o administrador).
   */
  async deleteExpense(homeId: string, expenseId: string): Promise<void> {
    await api.delete(`/homes/${homeId}/expenses/${expenseId}`);
  },

  /**
   * Obtiene los balances deudas/crédito de cada miembro del hogar.
   */
  async getHomeBalances(homeId: string): Promise<BalanceResponseDto[]> {
    const response = await api.get<BalanceResponseDto[]>(
      `/homes/${homeId}/expenses/balances`
    );
    return response.data;
  },

  /**
   * Obtiene las transferencias óptimas proyectadas para liquidar deudas entre convivientes.
   */
  async getOptimizedTransfers(homeId: string): Promise<DebtTransferResponseDto[]> {
    const response = await api.get<DebtTransferResponseDto[]>(
      `/homes/${homeId}/expenses/balances/transfers`
    );
    return response.data;
  },
};
