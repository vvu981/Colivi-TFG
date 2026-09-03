import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expenseService } from './expenseService';
import api from '../../../lib/api';

vi.mock('../../../lib/api');

describe('expenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getHomeExpenses calls GET /homes/:id/expenses with pagination and params', async () => {
    const mockPage = {
      content: [{ id: 'e1', description: 'Compra', totalAmount: 50 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
      empty: false,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const res = await expenseService.getHomeExpenses('h1', {
      search: 'compra',
      page: 1,
      size: 5,
    });

    expect(api.get).toHaveBeenCalledWith('/homes/h1/expenses', {
      params: {
        search: 'compra',
        payerId: undefined,
        onlyPayments: undefined,
        page: 1,
        size: 5,
      },
    });
    expect(res).toEqual(mockPage);
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

  it('updateExpense calls PUT /homes/:id/expenses/:expenseId with payload', async () => {
    const payload = {
      description: 'Luz actualizada',
      totalAmount: 120,
      payerId: 'u1',
      participantIds: ['u1', 'u2'],
    };
    const mockUpdated = { id: 'e2', ...payload };
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdated });

    const res = await expenseService.updateExpense('h1', 'e2', payload);
    expect(api.put).toHaveBeenCalledWith('/homes/h1/expenses/e2', payload);
    expect(res).toEqual(mockUpdated);
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
