import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportConversationModal } from './ReportConversationModal';
import { reportService } from '../services/reportService';

vi.mock('../services/reportService', () => ({
  reportService: {
    createReport: vi.fn(),
  },
}));

describe('ReportConversationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    conversationId: 'conv-uuid-1',
    interlocutorName: 'Carlos Gómez',
    listingTitle: 'Habitación céntrica',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(<ReportConversationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/denunciar conversación/i)).not.toBeInTheDocument();
  });

  it('renderiza correctamente el modal cuando isOpen es true', () => {
    render(<ReportConversationModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /denunciar conversación/i })).toBeInTheDocument();
    expect(screen.getByText(/chat con carlos gómez/i)).toBeInTheDocument();
    expect(screen.getByText(/habitación céntrica/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acoso, insultos o mensajes hostiles/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intento de estafa o pago externo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spam o publicidad no solicitada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contenido inapropiado o discriminatorio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/otro motivo/i)).toBeInTheDocument();
  });

  it('el botón de enviar permanece deshabilitado hasta que se selecciona un motivo', () => {
    render(<ReportConversationModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /enviar denuncia/i });
    expect(submitBtn).toBeDisabled();

    // Seleccionar motivo
    const harassmentRadio = screen.getByLabelText(/acoso, insultos o mensajes hostiles/i);
    fireEvent.click(harassmentRadio);

    expect(submitBtn).not.toBeDisabled();
  });

  it('llama a reportService.createReport con targetType CONVERSATION y muestra éxito', async () => {
    vi.mocked(reportService.createReport).mockResolvedValue({
      id: 'rep-conv-1',
      reporterId: 'user-reporter',
      targetType: 'CONVERSATION',
      targetId: defaultProps.conversationId,
      reason: 'HARASSMENT',
      description: 'Amenazas en el chat',
      status: 'PENDING',
      createdAt: '2026-09-07T10:00:00Z',
    });

    render(<ReportConversationModal {...defaultProps} />);

    // Seleccionar motivo
    fireEvent.click(screen.getByLabelText(/acoso, insultos o mensajes hostiles/i));

    // Escribir descripción
    const descTextarea = screen.getByPlaceholderText(/explica qué ha sucedido/i);
    fireEvent.change(descTextarea, { target: { value: 'Amenazas en el chat' } });

    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(reportService.createReport).toHaveBeenCalledWith({
        targetType: 'CONVERSATION',
        targetId: defaultProps.conversationId,
        reason: 'HARASSMENT',
        description: 'Amenazas en el chat',
      });
      expect(screen.getByText(/denuncia registrada/i)).toBeInTheDocument();
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });

    // Cerrar desde pantalla de éxito
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('muestra mensaje de error si la API rechaza la denuncia por ya estar denunciada', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: {
        data: { message: 'Esta conversación ya ha sido denunciada.' },
      },
    };
    vi.mocked(reportService.createReport).mockRejectedValue(errorResponse);

    render(<ReportConversationModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/intento de estafa o pago externo/i));
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/esta conversación ya ha sido denunciada/i)
      ).toBeInTheDocument();
    });
  });

  it('cierra el modal al pulsar la tecla Escape o el botón de cerrar', () => {
    render(<ReportConversationModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/cerrar modal/i));
    expect(defaultProps.onClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
