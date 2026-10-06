import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { Capacitor } from '@capacitor/core';

// Mock de useAuth
const mockLogin = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

// Mock de Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Capacitor.isNativePlatform as any).mockReturnValue(false);
  });

  const renderComponent = (initialEntries: any[] = ['/login']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <LoginForm />
      </MemoryRouter>
    );
  };

  it('renderiza campos de correo y contraseña y botón de submit', () => {
    renderComponent();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra el botón de Google SSO en entorno web', () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(false);
    renderComponent();
    expect(screen.getByText(/continuar con google/i)).toBeInTheDocument();
  });

  it('oculta el botón de Google SSO en entorno nativo móvil', () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);
    renderComponent();
    expect(screen.queryByText(/continuar con google/i)).not.toBeInTheDocument();
  });

  it('muestra mensaje informativo cuando se recibe desde location.state', () => {
    renderComponent([
      {
        pathname: '/login',
        state: { infoMessage: 'Mensaje de prueba informativo tras registro' },
      },
    ]);
    expect(screen.getByText('Mensaje de prueba informativo tras registro')).toBeInTheDocument();
  });

  it('permite iniciar sesión con credenciales válidas', async () => {
    mockLogin.mockResolvedValueOnce({ id: '1', role: 'USER' });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@colivi.es' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@colivi.es',
        password: 'password123',
      });
    });
  });
});
