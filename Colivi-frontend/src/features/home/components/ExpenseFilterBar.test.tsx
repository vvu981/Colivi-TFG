import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseFilterBar } from './ExpenseFilterBar';
import type { HomeMemberResponseDto } from '../types';

describe('ExpenseFilterBar', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'u1',
      fullName: 'Alice Smith',
      email: 'alice@test.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
    {
      userId: 'u2',
      fullName: 'Bob Jones',
      email: 'bob@test.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
  ];

  it('renders input, payer selector and type buttons correctly', () => {
    const onSearch = vi.fn();
    const onPayer = vi.fn();
    const onType = vi.fn();

    render(
      <ExpenseFilterBar
        searchQuery=""
        onSearchChange={onSearch}
        payerFilter=""
        onPayerChange={onPayer}
        typeFilter="ALL"
        onTypeChange={onType}
        activeMembers={mockMembers}
        totalResults={5}
      />
    );

    const input = screen.getByPlaceholderText(/buscar por concepto/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Supermercado' } });
    expect(onSearch).toHaveBeenCalledWith('Supermercado');

    const select = screen.getByLabelText(/filtrar por pagador/i);
    fireEvent.change(select, { target: { value: 'u1' } });
    expect(onPayer).toHaveBeenCalledWith('u1');

    const paymentsBtn = screen.getByRole('button', { name: /solo pagos/i });
    fireEvent.click(paymentsBtn);
    expect(onType).toHaveBeenCalledWith('PAYMENTS');

    expect(screen.getByText('5 resultados')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active and clears them on click', () => {
    const onSearch = vi.fn();
    const onPayer = vi.fn();
    const onType = vi.fn();

    render(
      <ExpenseFilterBar
        searchQuery="Luz"
        onSearchChange={onSearch}
        payerFilter="u1"
        onPayerChange={onPayer}
        typeFilter="EXPENSES"
        onTypeChange={onType}
        activeMembers={mockMembers}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /restablecer filtros/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onSearch).toHaveBeenCalledWith('');
    expect(onPayer).toHaveBeenCalledWith('');
    expect(onType).toHaveBeenCalledWith('ALL');
  });
});
