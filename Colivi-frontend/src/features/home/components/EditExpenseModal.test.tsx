import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditExpenseModal } from './EditExpenseModal';
import type { ExpenseResponseDto, HomeMemberResponseDto } from '../types';

describe('EditExpenseModal', () => {
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

  const mockExpense: ExpenseResponseDto = {
    id: 'e1',
    homeId: 'h1',
    description: 'Factura Internet',
    totalAmount: 50,
    payer: {
      id: 'u1',
      firstName: 'Alice',
      lastName1: 'Smith',
    },
    createdAt: '2026-02-01T10:00:00Z',
    isPayment: false,
    participants: [
      {
        id: 'p1',
        user: { id: 'u1', firstName: 'Alice', lastName1: 'Smith' },
        owedAmount: 25,
      },
      {
        id: 'p2',
        user: { id: 'u2', firstName: 'Bob', lastName1: 'Jones' },
        owedAmount: 25,
      },
    ],
  };

  it('prefills existing expense data and submits updated payload', async () => {
    const onUpdate = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();

    render(
      <EditExpenseModal
        isOpen={true}
        onClose={onClose}
        expense={mockExpense}
        activeMembers={mockMembers}
        currentUserId="u1"
        onUpdateExpense={onUpdate}
      />
    );

    const descInput = screen.getByLabelText(/concepto del gasto/i);
    expect(descInput).toHaveValue('Factura Internet');

    const amountInput = screen.getByLabelText(/importe total/i);
    expect(amountInput).toHaveValue(50);

    // Cambiar descripción e importe
    fireEvent.change(descInput, { target: { value: 'Factura Fibra + Móvil' } });
    fireEvent.change(amountInput, { target: { value: '60' } });

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('e1', {
        description: 'Factura Fibra + Móvil',
        totalAmount: 60,
        payerId: 'u1',
        participantIds: ['u1', 'u2'],
        customSplits: undefined,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
