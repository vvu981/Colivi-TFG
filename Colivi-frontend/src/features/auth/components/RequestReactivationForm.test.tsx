import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RequestReactivationForm } from './RequestReactivationForm';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    requestReactivation: vi.fn(),
  },
}));

describe('RequestReactivationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <RequestReactivationForm />
      </MemoryRouter>
    );
  };

  it('renderiza el formulario correctamente', () => {
    renderComponent();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /solicitar reactivación/i })
    ).toBeInTheDocument();
  });

  it('muestra errores de validación si el correo está vacío o es inválido', async () => {
    renderComponent();

    const button = screen.getByRole('button', { name: /solicitar reactivación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/por favor, introduce tu correo electrónico/i)
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/el formato del correo electrónico no es válido/i)
      ).toBeInTheDocument();
    });
  });

  it('muestra mensaje de éxito cuando la API responde correctamente', async () => {
    vi.mocked(authService.requestReactivation).mockResolvedValueOnce(undefined);
    renderComponent();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'deleteduser@example.com' } });

    const button = screen.getByRole('button', { name: /solicitar reactivación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/solicitud enviada/i)).toBeInTheDocument();
      expect(
        screen.getByText(/si existe una cuenta desactivada asociada a este correo/i)
      ).toBeInTheDocument();
    });

    expect(authService.requestReactivation).toHaveBeenCalledWith('deleteduser@example.com');
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    const errorResponse = {
      isAxiosError: true,
      response: { data: { message: 'Error de prueba del servidor' } },
    };
    vi.mocked(authService.requestReactivation).mockRejectedValueOnce(errorResponse);
    renderComponent();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'deleteduser@example.com' } });

    const button = screen.getByRole('button', { name: /solicitar reactivación/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de prueba del servidor')).toBeInTheDocument();
    });
  });
});
