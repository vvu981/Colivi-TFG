import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHomeExpenses } from './useHomeExpenses';
import { expenseService } from '../api/expenseService';
import { useAuth } from '../../auth/context/AuthContext';

vi.mock('../api/expenseService');
vi.mock('../../auth/context/AuthContext');

describe('useHomeExpenses hook', () => {
  const mockUser = {
    id: 'u1',
    email: 'user1@test.com',
    firstName: 'User',
    lastName1: 'One',
  };

  const mockExpenses = [
    {
      id: 'e1',
      homeId: 'h1',
      description: 'Compra semanal',
      totalAmount: 60,
      payer: mockUser,
      createdAt: '2026-01-01',
      participants: [],
    },
  ];

  const mockBalances = [
    {
      userId: 'u1',
      fullName: 'User One',
      email: 'user1@test.com',
      balance: 30,
    },
  ];

  const mockTransfers = [
    {
      fromUserId: 'u2',
      fromUserFullName: 'User Two',
      toUserId: 'u1',
      toUserFullName: 'User One',
      amount: 30,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      isAuthenticated: true,
      token: 'tok',
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(expenseService.getHomeExpenses).mockResolvedValue(mockExpenses as any);
    vi.mocked(expenseService.getHomeBalances).mockResolvedValue(mockBalances as any);
    vi.mocked(expenseService.getOptimizedTransfers).mockResolvedValue(mockTransfers as any);
  });

  it('loads expenses, balances and transfers on mount', async () => {
    const { result } = renderHook(() => useHomeExpenses('h1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expenses).toEqual(mockExpenses);
    expect(result.current.balances).toEqual(mockBalances);
    expect(result.current.transfers).toEqual(mockTransfers);
    expect(result.current.myBalance).toBe(30);
    expect(result.current.totalExpensesAmount).toBe(60);
  });

  it('calls createExpense and refreshes data', async () => {
    const newExp = { id: 'e2', totalAmount: 40 };
    vi.mocked(expenseService.createExpense).mockResolvedValueOnce(newExp as any);

    const { result } = renderHook(() => useHomeExpenses('h1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createExpense({
        description: 'Internet',
        totalAmount: 40,
        payerId: 'u1',
        participantIds: ['u1'],
      });
    });

    expect(expenseService.createExpense).toHaveBeenCalledWith('h1', expect.anything());
    expect(expenseService.getHomeExpenses).toHaveBeenCalledTimes(2);
  });

  it('calls deleteExpense and refreshes data', async () => {
    vi.mocked(expenseService.deleteExpense).mockResolvedValueOnce();

    const { result } = renderHook(() => useHomeExpenses('h1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteExpense('e1');
    });

    expect(expenseService.deleteExpense).toHaveBeenCalledWith('h1', 'e1');
    expect(expenseService.getHomeExpenses).toHaveBeenCalledTimes(2);
  });
});
