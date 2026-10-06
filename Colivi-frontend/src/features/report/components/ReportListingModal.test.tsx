import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportListingModal } from './ReportListingModal';
import { reportService } from '../services/reportService';

vi.mock('../services/reportService', () => ({
  reportService: {
    createReport: vi.fn(),
  },
}));

describe('ReportListingModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    listingId: 'listing-uuid-1',
    listingTitle: 'Habitación luminosa en el centro',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(<ReportListingModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/denunciar anuncio/i)).not.toBeInTheDocument();
  });

  it('renderiza correctamente el modal cuando isOpen es true', () => {
    render(<ReportListingModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /denunciar anuncio/i })).toBeInTheDocument();
    expect(screen.getByText(/habitación luminosa en el centro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fraude o información falsa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spam o publicidad no deseada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contenido ofensivo o inapropiado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acoso o comportamiento sospechoso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/otro motivo/i)).toBeInTheDocument();
  });

  it('el botón de enviar permanece deshabilitado hasta que se selecciona un motivo', () => {
    render(<ReportListingModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /enviar denuncia/i });
    expect(submitBtn).toBeDisabled();

    // Seleccionar motivo
    const fraudRadio = screen.getByLabelText(/fraude o información falsa/i);
    fireEvent.click(fraudRadio);

    expect(submitBtn).not.toBeDisabled();
  });

  it('llama a reportService.createReport y muestra la confirmación de éxito', async () => {
    vi.mocked(reportService.createReport).mockResolvedValueOnce({
      id: 'rep-1',
      reporterId: 'user-1',
      targetType: 'LISTING',
      targetId: defaultProps.listingId,
      reason: 'FRAUD',
      description: 'El precio real no coincide',
      status: 'PENDING',
      createdAt: '2026-08-30T10:00:00Z',
    });

    render(<ReportListingModal {...defaultProps} />);

    // Seleccionar motivo
    fireEvent.click(screen.getByLabelText(/fraude o información falsa/i));

    // Escribir descripción
    const descTextarea = screen.getByPlaceholderText(/aporta cualquier información/i);
    fireEvent.change(descTextarea, { target: { value: 'El precio real no coincide' } });

    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(reportService.createReport).toHaveBeenCalledWith({
        targetType: 'LISTING',
        targetId: defaultProps.listingId,
        reason: 'FRAUD',
        description: 'El precio real no coincide',
      });
      expect(screen.getByText(/denuncia enviada correctamente/i)).toBeInTheDocument();
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });

    // Cerrar desde pantalla de éxito
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('muestra mensaje de error si la API responde con fallo', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: {
        data: { message: 'Ya tienes una denuncia activa para este elemento.' },
      },
    };
    vi.mocked(reportService.createReport).mockRejectedValueOnce(errorResponse);

    render(<ReportListingModal {...defaultProps} />);

    // Seleccionar motivo y enviar
    fireEvent.click(screen.getByLabelText(/spam o publicidad no deseada/i));
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ya tienes una denuncia activa para este elemento/i)
      ).toBeInTheDocument();
    });
  });

  it('cierra el modal al pulsar la tecla Escape o el botón de cerrar', () => {
    render(<ReportListingModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/cerrar modal/i));
    expect(defaultProps.onClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
