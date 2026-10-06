import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteAccountModal } from './DeleteAccountModal';

describe('DeleteAccountModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DeleteAccountModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Eliminar cuenta')).not.toBeInTheDocument();
  });

  it('renders modal with warning and disabled submit button when opened', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Eliminar cuenta')).toBeInTheDocument();
    expect(
      screen.getByText(/¿Estás seguro de que deseas eliminar tu cuenta\?/i)
    ).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Eliminar mi cuenta/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button only when typing ELIMINAR', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Escribe ELIMINAR/i);
    const submitButton = screen.getByRole('button', { name: /Eliminar mi cuenta/i });

    // Wrong text
    fireEvent.change(input, { target: { value: 'BORRAR' } });
    expect(submitButton).toBeDisabled();

    // Correct text (case insensitive with trim)
    fireEvent.change(input, { target: { value: ' eliminar ' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onConfirm when form is submitted with valid keyword', async () => {
    mockOnConfirm.mockResolvedValueOnce(undefined);

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Escribe ELIMINAR/i);
    fireEvent.change(input, { target: { value: 'ELIMINAR' } });

    const submitButton = screen.getByRole('button', { name: /Eliminar mi cuenta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error message when onConfirm fails', async () => {
    mockOnConfirm.mockRejectedValueOnce({
      response: {
        data: {
          message: 'No se puede eliminar la cuenta debido a reservas activas.',
        },
      },
    });

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Escribe ELIMINAR/i);
    fireEvent.change(input, { target: { value: 'ELIMINAR' } });

    const submitButton = screen.getByRole('button', { name: /Eliminar mi cuenta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('No se puede eliminar la cuenta debido a reservas activas.')
      ).toBeInTheDocument();
    });
  });

  it('calls onClose when clicking Cancel button', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
