import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseBalancesList } from './ExpenseBalancesList';
import type { BalanceResponseDto, DebtTransferResponseDto } from '../types';

describe('ExpenseBalancesList', () => {
  it('renderiza correctamente los saldos cuando vienen con la estructura real del backend (user y amount)', () => {
    const mockBalances: BalanceResponseDto[] = [
      {
        user: {
          id: 'u1',
          firstName: 'Víctor',
          lastName1: 'Vallejo',
          profilePicUrl: null,
        },
        amount: 25.5,
      },
      {
        user: {
          id: 'u2',
          firstName: 'Ana',
          lastName1: 'López',
          profilePicUrl: null,
        },
        amount: -25.5,
      },
    ];

    const mockTransfers: DebtTransferResponseDto[] = [
      {
        fromUser: {
          id: 'u2',
          firstName: 'Ana',
          lastName1: 'López',
        },
        toUser: {
          id: 'u1',
          firstName: 'Víctor',
          lastName1: 'Vallejo',
        },
        amount: 25.5,
      },
    ];

    render(
      <ExpenseBalancesList
        balances={mockBalances}
        transfers={mockTransfers}
        currentUserId="u1"
      />
    );

    // Saldo positivo de Víctor (+25.50 €)
    expect(screen.getByText('Víctor Vallejo')).toBeInTheDocument();
    expect(screen.getByText('Tú')).toBeInTheDocument();
    expect(screen.getByText('+25.50 €')).toBeInTheDocument();
    expect(screen.getByText('Le deben al miembro')).toBeInTheDocument();

    // Saldo negativo de Ana (-25.50 €)
    expect(screen.getAllByText('Ana López')[0]).toBeInTheDocument();
    expect(screen.getByText('-25.50 €')).toBeInTheDocument();
    expect(screen.getByText('Debe al grupo')).toBeInTheDocument();

    // Transferencia
    expect(screen.getByText('25.50 €')).toBeInTheDocument();
  });

  it('renderiza de forma segura si algún campo de usuario viene ausente o nulo', () => {
    const mockBalances: BalanceResponseDto[] = [
      {
        user: {
          id: 'u3',
        },
        amount: 0,
      },
    ];

    render(
      <ExpenseBalancesList
        balances={mockBalances}
        transfers={[]}
        currentUserId="u1"
      />
    );

    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('0.00 €')).toBeInTheDocument();
    expect(screen.getByText('Al corriente')).toBeInTheDocument();
  });
});
