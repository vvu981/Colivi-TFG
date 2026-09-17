import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteListingModal } from './ConfirmDeleteListingModal';

describe('ConfirmDeleteListingModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    listingTitle: 'Habitación céntrica en Madrid',
    onConfirmDelete: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDeleteListingModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with title and listing details when open', () => {
    render(<ConfirmDeleteListingModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar Anuncio')).toBeInTheDocument();
    expect(screen.getByText('Habitación céntrica en Madrid')).toBeInTheDocument();
    expect(screen.getByText(/El anuncio dejará de estar visible en las búsquedas/)).toBeInTheDocument();
  });

  it('calls onClose when clicking the close X button', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteListingModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Cerrar ventana');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking Cancel button', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteListingModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteListingModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmDelete when clicking the confirm button', () => {
    const onConfirmDelete = vi.fn();
    render(<ConfirmDeleteListingModal {...defaultProps} onConfirmDelete={onConfirmDelete} />);

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    fireEvent.click(deleteBtn);
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('renders error message when error prop is provided', () => {
    render(
      <ConfirmDeleteListingModal
        {...defaultProps}
        error="No tienes permisos para realizar esta acción."
      />
    );

    expect(screen.getByText('No tienes permisos para realizar esta acción.')).toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmDeleteListingModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar anuncio' })).toBeDisabled();
  });
});
