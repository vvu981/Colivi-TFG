import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportFeedbackModal } from './ReportFeedbackModal';
import type { ReportFeedbackResponse } from '../types/report.types';

describe('ReportFeedbackModal', () => {
  const mockFeedback: ReportFeedbackResponse = {
    id: 'report-123',
    targetType: 'LISTING',
    reason: 'FRAUD',
    resolvedAt: '2026-08-30T10:00:00Z',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    feedback: mockFeedback,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    render(<ReportFeedbackModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/denuncia revisada y resuelta/i)).not.toBeInTheDocument();
  });

  it('no renderiza nada cuando feedback es null', () => {
    render(<ReportFeedbackModal {...defaultProps} feedback={null} />);
    expect(screen.queryByText(/denuncia revisada y resuelta/i)).not.toBeInTheDocument();
  });

  it('renderiza correctamente la información de agradecimiento para un anuncio', () => {
    render(<ReportFeedbackModal {...defaultProps} />);

    expect(screen.getByText(/denuncia revisada y resuelta/i)).toBeInTheDocument();
    expect(screen.getByText(/el anuncio/i)).toBeInTheDocument();
    expect(screen.getByText(/fraude/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument();
  });

  it('renderiza correctamente la información de agradecimiento para un usuario', () => {
    const userFeedback: ReportFeedbackResponse = {
      id: 'report-456',
      targetType: 'USER',
      reason: 'HARASSMENT',
      resolvedAt: '2026-08-30T10:00:00Z',
    };

    render(<ReportFeedbackModal {...defaultProps} feedback={userFeedback} />);

    expect(screen.getByText(/el usuario/i)).toBeInTheDocument();
    expect(screen.getByText(/acoso/i)).toBeInTheDocument();
  });

  it('llama a onClose al pulsar el botón Entendido', () => {
    render(<ReportFeedbackModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: /entendido/i });
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al pulsar el botón de cerrar X', () => {
    render(<ReportFeedbackModal {...defaultProps} />);

    const xBtn = screen.getByLabelText(/cerrar modal/i);
    fireEvent.click(xBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
