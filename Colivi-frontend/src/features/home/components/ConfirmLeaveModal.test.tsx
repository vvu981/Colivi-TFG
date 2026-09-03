import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmLeaveModal } from './ConfirmLeaveModal';

describe('ConfirmLeaveModal', () => {
  it('renders correctly and confirms leave when user has zero balance', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onTransfer = vi.fn();

    render(
      <ConfirmLeaveModal
        isOpen={true}
        onClose={onClose}
        homeName="Casa Test"
        isSoleActiveMember={false}
        isOnlyAdminWithOtherMembers={false}
        userBalance={0}
        onConfirmLeave={onConfirm}
        onOpenTransferAdmin={onTransfer}
      />
    );

    expect(screen.getByText('Salir de Casa Test')).toBeInTheDocument();
    const leaveBtn = screen.getByRole('button', { name: /salir del hogar/i });
    expect(leaveBtn).not.toBeDisabled();

    fireEvent.click(leaveBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('blocks leave action and disables button when user has negative balance (debt)', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const onTransfer = vi.fn();

    render(
      <ConfirmLeaveModal
        isOpen={true}
        onClose={onClose}
        homeName="Casa Test"
        isSoleActiveMember={false}
        isOnlyAdminWithOtherMembers={false}
        userBalance={-25.5}
        onConfirmLeave={onConfirm}
        onOpenTransferAdmin={onTransfer}
      />
    );

    expect(screen.getByText(/Acción bloqueada: Deuda activa/i)).toBeInTheDocument();
    expect(screen.getByText(/-25.50 €/i)).toBeInTheDocument();

    const leaveBtn = screen.getByRole('button', { name: /salir del hogar/i });
    expect(leaveBtn).toBeDisabled();
  });

  it('blocks leave action and disables button when user has credit balance (positive balance)', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const onTransfer = vi.fn();

    render(
      <ConfirmLeaveModal
        isOpen={true}
        onClose={onClose}
        homeName="Casa Test"
        isSoleActiveMember={false}
        isOnlyAdminWithOtherMembers={false}
        userBalance={50.0}
        onConfirmLeave={onConfirm}
        onOpenTransferAdmin={onTransfer}
      />
    );

    expect(screen.getByText(/Acción bloqueada: Saldo a favor pendiente/i)).toBeInTheDocument();
    expect(screen.getByText(/\+50.00 €/i)).toBeInTheDocument();

    const leaveBtn = screen.getByRole('button', { name: /salir del hogar/i });
    expect(leaveBtn).toBeDisabled();
  });
});
