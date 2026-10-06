import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateExpenseModal } from './CreateExpenseModal';
import type { HomeMemberResponseDto } from '../types';

describe('CreateExpenseModal', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'u1',
      fullName: 'Usuario A',
      email: 'a@test.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
    {
      userId: 'u2',
      fullName: 'Usuario B',
      email: 'b@test.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnCreateExpense = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <CreateExpenseModal
        isOpen={false}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza correctamente el formulario cuando isOpen es true', () => {
    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );

    expect(screen.getByRole('heading', { name: 'Añadir Nuevo Gasto' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Concepto del Gasto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total \(€\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/¿Quién pagó el gasto\?/i)).toBeInTheDocument();
    expect(screen.getByText('Equitativo')).toBeInTheDocument();
    expect(screen.getByText('Porcentaje')).toBeInTheDocument();
    expect(screen.getByText('Importe Exacto')).toBeInTheDocument();
  });

  it('permite crear un gasto en modo equitativo por defecto', async () => {
    const user = userEvent.setup();
    mockOnCreateExpense.mockResolvedValueOnce({});

    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );

    await user.type(screen.getByLabelText(/Concepto del Gasto/i), 'Compra semanal');
    await user.type(screen.getByLabelText(/Total \(€\)/i), '60');

    const submitBtn = screen.getByRole('button', { name: /Guardar Gasto/i });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnCreateExpense).toHaveBeenCalledWith({
        description: 'Compra semanal',
        totalAmount: 60,
        payerId: 'u1',
        participantIds: ['u1', 'u2'],
        customSplits: undefined,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('en modo porcentaje, valida que no supere el 100% y bloquea el envío si supera', async () => {
    const user = userEvent.setup();

    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );

    await user.type(screen.getByLabelText(/Concepto del Gasto/i), 'Cena');
    await user.type(screen.getByLabelText(/Total \(€\)/i), '100');

    // Cambiar a modo Porcentaje
    await user.click(screen.getByText('Porcentaje'));

    // Poner a Usuario A 70% y a Usuario B 50% (Suma 120% > 100%)
    const pctInputs = screen.getAllByPlaceholderText('0');
    await user.clear(pctInputs[0]);
    await user.type(pctInputs[0], '70');

    await user.clear(pctInputs[1]);
    await user.type(pctInputs[1], '50');

    expect(screen.getByText(/La suma de porcentajes no puede superar el 100%/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Guardar Gasto/i });
    expect(submitBtn).toBeDisabled();
  });

  it('en modo porcentaje, envía customSplits con importes calculados al sumar 100%', async () => {
    const user = userEvent.setup();
    mockOnCreateExpense.mockResolvedValueOnce({});

    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );

    await user.type(screen.getByLabelText(/Concepto del Gasto/i), 'Factura Luz');
    await user.type(screen.getByLabelText(/Total \(€\)/i), '100');

    await user.click(screen.getByText('Porcentaje'));

    const pctInputs = screen.getAllByPlaceholderText('0');
    await user.clear(pctInputs[0]);
    await user.type(pctInputs[0], '60');

    await user.clear(pctInputs[1]);
    await user.type(pctInputs[1], '40');

    expect(screen.getByText(/Reparto del 100% completado correctamente/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Guardar Gasto/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockOnCreateExpense).toHaveBeenCalledWith({
        description: 'Factura Luz',
        totalAmount: 100,
        payerId: 'u1',
        participantIds: ['u1', 'u2'],
        customSplits: [
          { userId: 'u1', amount: 60 },
          { userId: 'u2', amount: 40 },
        ],
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('en modo importe exacto, valida que no supere el total del gasto', async () => {
    const user = userEvent.setup();

    render(
      <CreateExpenseModal
        isOpen={true}
        onClose={mockOnClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onCreateExpense={mockOnCreateExpense}
      />
    );

    await user.type(screen.getByLabelText(/Concepto del Gasto/i), 'Gas');
    await user.type(screen.getByLabelText(/Total \(€\)/i), '80');

    await user.click(screen.getByText('Importe Exacto'));

    const amtInputs = screen.getAllByPlaceholderText('0.00');
    await user.clear(amtInputs[0]);
    await user.type(amtInputs[0], '50');

    await user.clear(amtInputs[1]);
    await user.type(amtInputs[1], '40'); // 50 + 40 = 90 > 80

    expect(screen.getByText(/La correspondencia no puede superar el gasto completo/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Guardar Gasto/i });
    expect(submitBtn).toBeDisabled();
  });
});
