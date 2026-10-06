import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportUserModal } from './ReportUserModal';
import { reportService } from '../services/reportService';

vi.mock('../services/reportService', () => ({
  reportService: {
    createReport: vi.fn(),
  },
}));

describe('ReportUserModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'user-uuid-1',
    userNickname: 'mariagarcia',
    userName: 'María García',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(<ReportUserModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/denunciar usuario/i)).not.toBeInTheDocument();
  });

  it('renderiza correctamente el modal cuando isOpen es true', () => {
    render(<ReportUserModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /denunciar usuario/i })).toBeInTheDocument();
    expect(screen.getByText(/María García/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acoso o comportamiento hostil/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fraude, estafa o suplantación de identidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spam o publicidad no autorizada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contenido o foto de perfil inapropiada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/otro motivo/i)).toBeInTheDocument();
  });

  it('el botón de enviar permanece deshabilitado hasta que se selecciona un motivo', () => {
    render(<ReportUserModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /enviar denuncia/i });
    expect(submitBtn).toBeDisabled();

    // Seleccionar motivo
    const harassmentRadio = screen.getByLabelText(/acoso o comportamiento hostil/i);
    fireEvent.click(harassmentRadio);

    expect(submitBtn).not.toBeDisabled();
  });

  it('llama a reportService.createReport con targetType USER y muestra confirmación de éxito', async () => {
    vi.mocked(reportService.createReport).mockResolvedValueOnce({
      id: 'rep-user-1',
      reporterId: 'reporter-1',
      targetType: 'USER',
      targetId: defaultProps.userId,
      reason: 'HARASSMENT',
      description: 'Comportamiento intimidatorio',
      status: 'PENDING',
      createdAt: '2026-08-30T10:00:00Z',
    });

    render(<ReportUserModal {...defaultProps} />);

    // Seleccionar motivo
    fireEvent.click(screen.getByLabelText(/acoso o comportamiento hostil/i));

    // Escribir descripción
    const descTextarea = screen.getByPlaceholderText(/aporta contexto relevante/i);
    fireEvent.change(descTextarea, { target: { value: 'Comportamiento intimidatorio' } });

    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(reportService.createReport).toHaveBeenCalledWith({
        targetType: 'USER',
        targetId: defaultProps.userId,
        reason: 'HARASSMENT',
        description: 'Comportamiento intimidatorio',
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
        data: { message: 'No puedes denunciarte a ti mismo.' },
      },
    };
    vi.mocked(reportService.createReport).mockRejectedValueOnce(errorResponse);

    render(<ReportUserModal {...defaultProps} />);

    // Seleccionar motivo y enviar
    fireEvent.click(screen.getByLabelText(/spam o publicidad no autorizada/i));
    fireEvent.click(screen.getByRole('button', { name: /enviar denuncia/i }));

    await waitFor(() => {
      expect(screen.getByText(/no puedes denunciarte a ti mismo/i)).toBeInTheDocument();
    });
  });

  it('cierra el modal al pulsar la tecla Escape o el botón de cerrar', () => {
    render(<ReportUserModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText(/cerrar modal/i));
    expect(defaultProps.onClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
