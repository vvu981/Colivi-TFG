import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expenseService } from './expenseService';
import api from '../../../lib/api';

vi.mock('../../../lib/api');

describe('expenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getHomeExpenses calls GET /homes/:id/expenses and returns data', async () => {
    const mockExpenses = [{ id: 'e1', description: 'Compra', totalAmount: 50 }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockExpenses });

    const res = await expenseService.getHomeExpenses('h1');
    expect(api.get).toHaveBeenCalledWith('/homes/h1/expenses');
    expect(res).toEqual(mockExpenses);
  });

  it('createExpense calls POST /homes/:id/expenses with payload', async () => {
    const payload = {
      description: 'Luz',
      totalAmount: 100,
      payerId: 'u1',
      participantIds: ['u1', 'u2'],
    };
    const mockCreated = { id: 'e2', ...payload };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated });

    const res = await expenseService.createExpense('h1', payload);
    expect(api.post).toHaveBeenCalledWith('/homes/h1/expenses', payload);
    expect(res).toEqual(mockCreated);
  });

  it('deleteExpense calls DELETE /homes/:id/expenses/:expenseId', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({});

    await expenseService.deleteExpense('h1', 'e1');
    expect(api.delete).toHaveBeenCalledWith('/homes/h1/expenses/e1');
  });

  it('getHomeBalances calls GET /homes/:id/expenses/balances', async () => {
    const mockBalances = [{ userId: 'u1', fullName: 'Víctor', balance: 25 }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBalances });

    const res = await expenseService.getHomeBalances('h1');
    expect(api.get).toHaveBeenCalledWith('/homes/h1/expenses/balances');
    expect(res).toEqual(mockBalances);
  });

  it('getOptimizedTransfers calls GET /homes/:id/expenses/balances/transfers', async () => {
    const mockTransfers = [{ fromUserId: 'u2', toUserId: 'u1', amount: 25 }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTransfers });

    const res = await expenseService.getOptimizedTransfers('h1');
    expect(api.get).toHaveBeenCalledWith('/homes/h1/expenses/balances/transfers');
    expect(res).toEqual(mockTransfers);
  });
});
