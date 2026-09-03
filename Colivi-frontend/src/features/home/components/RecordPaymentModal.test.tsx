import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecordPaymentModal } from './RecordPaymentModal';
import type { HomeMemberResponseDto } from '../types';

describe('RecordPaymentModal Component', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'u1',
      fullName: 'Alice Smith',
      email: 'alice@colivi.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
    {
      userId: 'u2',
      fullName: 'Bob Jones',
      email: 'bob@colivi.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-02',
    },
    {
      userId: 'u3',
      fullName: 'Charlie Brown',
      email: 'charlie@colivi.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-03',
    },
  ];

  it('renders correctly when open', () => {
    render(
      <RecordPaymentModal
        isOpen={true}
        onClose={vi.fn()}
        activeMembers={mockMembers}
        currentUserId="u1"
        onRecordPayment={vi.fn()}
      />
    );

    expect(screen.getByText(/Registrar Pago entre Convivientes/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Quién pagó el dinero\?/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Quién recibió el dinero\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Importe Pagado/i)).toBeInTheDocument();
  });

  it('prefills fields when initial values are provided', () => {
    render(
      <RecordPaymentModal
        isOpen={true}
        onClose={vi.fn()}
        activeMembers={mockMembers}
        currentUserId="u1"
        initialPayerId="u2"
        initialReceiverId="u1"
        initialAmount={35.5}
        onRecordPayment={vi.fn()}
      />
    );

    const amountInput = screen.getByLabelText(/Importe Pagado/i) as HTMLInputElement;
    expect(amountInput.value).toBe('35.50');
  });

  it('submits payment when form is valid', async () => {
    const handleRecordPayment = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <RecordPaymentModal
        isOpen={true}
        onClose={handleClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        initialPayerId="u2"
        initialReceiverId="u1"
        initialAmount={25.0}
        onRecordPayment={handleRecordPayment}
      />
    );

    const notesInput = screen.getByLabelText(/Concepto \/ Notas/i);
    fireEvent.change(notesInput, { target: { value: 'Bizum de la compra semanal' } });

    const submitBtn = screen.getByRole('button', { name: /Registrar Pago/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleRecordPayment).toHaveBeenCalledWith({
        payerId: 'u2',
        receiverId: 'u1',
        amount: 25.0,
        notes: 'Bizum de la compra semanal',
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('displays error when amount is invalid', async () => {
    const handleRecordPayment = vi.fn();

    render(
      <RecordPaymentModal
        isOpen={true}
        onClose={vi.fn()}
        activeMembers={mockMembers}
        currentUserId="u1"
        initialPayerId="u1"
        initialReceiverId="u2"
        onRecordPayment={handleRecordPayment}
      />
    );

    const amountInput = screen.getByLabelText(/Importe Pagado/i);
    fireEvent.change(amountInput, { target: { value: '-5' } });

    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText(/El importe del pago debe ser un número mayor que 0.00 €/i)).toBeInTheDocument();
    expect(handleRecordPayment).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking cancel button', () => {
    const handleClose = vi.fn();

    render(
      <RecordPaymentModal
        isOpen={true}
        onClose={handleClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onRecordPayment={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
