import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseSummaryCards } from './ExpenseSummaryCards';

describe('ExpenseSummaryCards', () => {
  it('renderiza balance positivo con indicación de que le deben', () => {
    render(
      <ExpenseSummaryCards
        myBalance={45.5}
        totalExpensesAmount={200}
        expensesCount={3}
      />
    );

    expect(screen.getByText('+45.50 €')).toBeInTheDocument();
    expect(screen.getByText('Te deben dinero en el grupo')).toBeInTheDocument();
    expect(screen.getByText('200.00 €')).toBeInTheDocument();
    expect(screen.getByText('3 gastos')).toBeInTheDocument();
  });

  it('renderiza balance negativo con indicación de que debe', () => {
    render(
      <ExpenseSummaryCards
        myBalance={-30}
        totalExpensesAmount={150}
        expensesCount={1}
      />
    );

    expect(screen.getByText('-30.00 €')).toBeInTheDocument();
    expect(screen.getByText('Debes dinero a tus compañeros')).toBeInTheDocument();
    expect(screen.getByText('1 gasto')).toBeInTheDocument();
  });

  it('renderiza balance neutro cuando está a cero', () => {
    render(
      <ExpenseSummaryCards
        myBalance={0}
        totalExpensesAmount={0}
        expensesCount={0}
      />
    );

    expect(screen.getAllByText(/0\.00/)[0]).toBeInTheDocument();
    expect(screen.getByText('Estás al día con todos los pagos')).toBeInTheDocument();
  });
});
