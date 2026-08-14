import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { authService } from '../services/authService';

// Mock del servicio de autenticación
vi.mock('../services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    );
  };

  it('renderiza el formulario correctamente', () => {
    renderComponent();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
  });

  it('muestra errores de validación si el correo está vacío o es inválido', async () => {
    renderComponent();
    
    const button = screen.getByRole('button', { name: /enviar enlace de recuperación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/por favor, introduce tu correo electrónico/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/el formato del correo electrónico no es válido/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de éxito cuando la API responde correctamente', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValueOnce(undefined);
    renderComponent();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const button = screen.getByRole('button', { name: /enviar enlace de recuperación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/correo enviado/i)).toBeInTheDocument();
      expect(screen.getByText(/si existe una cuenta asociada/i)).toBeInTheDocument();
    });
    
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: { data: { message: 'Error desde el servidor' } },
    };
    vi.mocked(authService.forgotPassword).mockRejectedValueOnce(errorResponse);
    renderComponent();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const button = screen.getByRole('button', { name: /enviar enlace de recuperación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error desde el servidor')).toBeInTheDocument();
    });
  });
});
