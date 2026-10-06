import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminConfirmModal } from './AdminConfirmModal';

describe('AdminConfirmModal', () => {
  it('renders title, message and triggers onConfirm on button click', () => {
    const onConfirmMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <AdminConfirmModal
        isOpen={true}
        title="¿Confirmar acción?"
        message="Esta acción no se puede deshacer."
        confirmText="Sí, proceder"
        onConfirm={onConfirmMock}
        onClose={onCloseMock}
      />
    );

    expect(screen.getByText('¿Confirmar acción?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sí, proceder'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
