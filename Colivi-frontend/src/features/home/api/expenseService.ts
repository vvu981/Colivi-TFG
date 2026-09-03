import api from '../../../lib/api';
import type {
  ExpenseResponseDto,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  RecordPaymentRequest,
  BalanceResponseDto,
  DebtTransferResponseDto,
  ExpenseFilterParams,
  Page,
} from '../types';

export const expenseService = {
  /**
   * Obtiene la lista paginada y filtrada de gastos del hogar.
   */
  async getHomeExpenses(
    homeId: string,
    params?: ExpenseFilterParams
  ): Promise<Page<ExpenseResponseDto>> {
    const response = await api.get<Page<ExpenseResponseDto>>(`/homes/${homeId}/expenses`, {
      params: {
        search: params?.search || undefined,
        payerId: params?.payerId || undefined,
        onlyPayments: params?.onlyPayments,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    });
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
   * Actualiza un gasto existente (solo permitido al pagador o administrador).
   */
  async updateExpense(
    homeId: string,
    expenseId: string,
    data: UpdateExpenseRequest
  ): Promise<ExpenseResponseDto> {
    const response = await api.put<ExpenseResponseDto>(
      `/homes/${homeId}/expenses/${expenseId}`,
      data
    );
    return response.data;
  },

  /**
   * Registra un pago directo entre dos convivientes para saldar deudas.
   */
  async recordPayment(
    homeId: string,
    data: RecordPaymentRequest
  ): Promise<ExpenseResponseDto> {
    const response = await api.post<ExpenseResponseDto>(
      `/homes/${homeId}/expenses/payments`,
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
