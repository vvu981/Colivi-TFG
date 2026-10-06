import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordForm } from './ResetPasswordForm';
import { authService } from '../services/authService';

// Mock del servicio de autenticación
vi.mock('../services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialUrl = '/reset-password?token=valid-token') => {
    return render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <ResetPasswordForm />
      </MemoryRouter>
    );
  };

  it('muestra mensaje de error si no hay token en la URL', () => {
    renderComponent('/reset-password');
    expect(screen.getByText(/enlace inválido/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^nueva contraseña/i)).not.toBeInTheDocument();
  });

  it('renderiza el formulario correctamente si hay token', () => {
    renderComponent();
    expect(screen.getByLabelText(/^nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toBeInTheDocument();
  });

  it('muestra errores de validación si las contraseñas no cumplen requisitos o no coinciden', async () => {
    renderComponent();
    
    const newPasswordInput = screen.getByLabelText(/^nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar nueva contraseña/i);
    const button = screen.getByRole('button', { name: /restablecer contraseña/i });

    // Contraseña débil
    fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });

    // Contraseña sin mayúscula y número
    fireEvent.change(newPasswordInput, { target: { value: 'passwordlong' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'passwordlong' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/debe contener al menos una mayúscula/i)).toBeInTheDocument();
    });

    // Contraseñas no coinciden
    fireEvent.change(newPasswordInput, { target: { value: 'Valid1Password' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Valid2Password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de éxito cuando la API responde correctamente', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValueOnce(undefined);
    renderComponent();

    const newPasswordInput = screen.getByLabelText(/^nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar nueva contraseña/i);
    const button = screen.getByRole('button', { name: /restablecer contraseña/i });

    fireEvent.change(newPasswordInput, { target: { value: 'Valid1Password' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Valid1Password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/contraseña restablecida/i)).toBeInTheDocument();
    });
    
    expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'Valid1Password');
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: { data: { message: 'El token ha expirado' } },
    };
    vi.mocked(authService.resetPassword).mockRejectedValueOnce(errorResponse);
    renderComponent();

    const newPasswordInput = screen.getByLabelText(/^nueva contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar nueva contraseña/i);
    const button = screen.getByRole('button', { name: /restablecer contraseña/i });

    fireEvent.change(newPasswordInput, { target: { value: 'Valid1Password' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Valid1Password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('El token ha expirado')).toBeInTheDocument();
    });
  });
});
