import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmArchiveModal } from './ConfirmArchiveModal';

describe('ConfirmArchiveModal', () => {
  it('renderiza título, nombre del hogar y mensaje informativo sobre la pestaña de archivados', () => {
    render(
      <ConfirmArchiveModal
        isOpen={true}
        onClose={vi.fn()}
        homeName="Piso Campanar"
        onConfirmArchive={vi.fn()}
      />
    );

    expect(screen.getByText('¿Archivar hogar?')).toBeInTheDocument();
    expect(screen.getAllByText('Piso Campanar')[0]).toBeInTheDocument();
    expect(screen.getByText(/¿Dónde podré ver este hogar\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Hogares archivados/i)).toBeInTheDocument();
  });

  it('llama a onConfirmArchive y onClose al confirmar', async () => {
    const onConfirmArchive = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmArchiveModal
        isOpen={true}
        onClose={onClose}
        homeName="Piso Campanar"
        onConfirmArchive={onConfirmArchive}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y Archivar/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirmArchive).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
