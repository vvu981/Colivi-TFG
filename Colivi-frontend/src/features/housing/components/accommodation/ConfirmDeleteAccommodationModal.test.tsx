import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmDeleteAccommodationModal } from './ConfirmDeleteAccommodationModal';

describe('ConfirmDeleteAccommodationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    accommodationAddress: 'Calle Gran Vía 12, Madrid',
    onConfirmDelete: vi.fn(),
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(
      <ConfirmDeleteAccommodationModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with title and accommodation details when open', () => {
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar Alojamiento')).toBeInTheDocument();
    expect(screen.getByText('Calle Gran Vía 12, Madrid')).toBeInTheDocument();
    expect(screen.getByText(/El inmueble dejará de estar disponible en tu panel/)).toBeInTheDocument();
  });

  it('calls onClose when clicking the close X button', () => {
    const onClose = vi.fn();
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Cerrar ventana');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking Cancel button', () => {
    const onClose = vi.fn();
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape key when isLoading is true', () => {
    const onClose = vi.fn();
    renderWithRouter(
      <ConfirmDeleteAccommodationModal {...defaultProps} onClose={onClose} isLoading={true} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onConfirmDelete when clicking the confirm button', () => {
    const onConfirmDelete = vi.fn();
    renderWithRouter(
      <ConfirmDeleteAccommodationModal {...defaultProps} onConfirmDelete={onConfirmDelete} />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar alojamiento' });
    fireEvent.click(deleteBtn);
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('renders error message and link to listings when active listings error occurs', () => {
    renderWithRouter(
      <ConfirmDeleteAccommodationModal
        {...defaultProps}
        error="No es posible eliminar el alojamiento porque todavía tiene anuncios activos asociados."
      />
    );

    expect(
      screen.getByText(
        'No es posible eliminar el alojamiento porque todavía tiene anuncios activos asociados.'
      )
    );
    const link = screen.getByRole('link', { name: /Ir a Mis Anuncios/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/my-listings');
  });

  it('renders link with accommodationId query param when accommodationId is provided', () => {
    renderWithRouter(
      <ConfirmDeleteAccommodationModal
        {...defaultProps}
        accommodationId="acc-123"
        error="No es posible eliminar el alojamiento porque todavía tiene anuncios activos asociados."
      />
    );

    const link = screen.getByRole('link', { name: /Ir a Mis Anuncios/ });
    expect(link).toHaveAttribute('href', '/my-listings?accommodationId=acc-123');
  });

  it('renders generic error message without link when error is unrelated to active listings', () => {
    renderWithRouter(
      <ConfirmDeleteAccommodationModal
        {...defaultProps}
        error="Error de conexión con el servidor."
      />
    );

    expect(screen.getByText('Error de conexión con el servidor.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ir a Mis Anuncios/ })).not.toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar alojamiento' })).toBeDisabled();
  });

  it('closes modal when clicking backdrop outside container', () => {
    const onClose = vi.fn();
    renderWithRouter(<ConfirmDeleteAccommodationModal {...defaultProps} onClose={onClose} />);

    const dialogBackdrop = screen.getByRole('dialog');
    fireEvent.click(dialogBackdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
