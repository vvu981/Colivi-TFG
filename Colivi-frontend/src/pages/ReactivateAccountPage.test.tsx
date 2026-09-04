import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReactivateAccountPage } from './ReactivateAccountPage';
import { useAuth } from '../features/auth/context/AuthContext';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ReactivateAccountPage', () => {
  const mockReactivateAccount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      reactivateAccount: mockReactivateAccount,
    } as any);
  });

  it('muestra error si no se incluye el parámetro token en la URL', () => {
    render(
      <MemoryRouter initialEntries={['/reactivate']}>
        <ReactivateAccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No se pudo reactivar la cuenta')).toBeInTheDocument();
    expect(
      screen.getByText(/no se ha proporcionado un token de reactivación/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /solicitar nuevo enlace de reactivación/i })
    ).toBeInTheDocument();
  });

  it('procesa y muestra pantalla de éxito cuando el token es válido', async () => {
    mockReactivateAccount.mockResolvedValueOnce({
      id: '123',
      email: 'test@example.com',
    });

    render(
      <MemoryRouter initialEntries={['/reactivate?token=valid-token-123']}>
        <ReactivateAccountPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockReactivateAccount).toHaveBeenCalledWith('valid-token-123');
      expect(screen.getByText('¡Cuenta reactivada con éxito!')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /ir a la página principal/i })
      ).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error cuando el token es inválido o ha caducado', async () => {
    mockReactivateAccount.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          message: 'Error: El enlace de reactivación ha caducado. Solicita uno nuevo.',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/reactivate?token=expired-token-123']}>
        <ReactivateAccountPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No se pudo reactivar la cuenta')).toBeInTheDocument();
      expect(
        screen.getByText(/el enlace de reactivación ha caducado/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /solicitar nuevo enlace de reactivación/i })
      ).toBeInTheDocument();
    });
  });
});
