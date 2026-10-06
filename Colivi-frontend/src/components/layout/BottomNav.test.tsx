import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import * as AuthContext from '../../features/auth/context/AuthContext';
import { messagingApi } from '../../features/messaging/api/messagingApi';
import type { UserProfile } from '../../features/user/types/user.types';

vi.mock('../../features/auth/context/AuthContext');
vi.mock('../../features/messaging/api/messagingApi');

describe('BottomNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messagingApi.getUnreadMessagesCount).mockResolvedValue({ unreadCount: 0 });
  });

  it('renderiza enlaces básicos y opción de entrar cuando el usuario no está autenticado', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.queryByText('Mensajes')).not.toBeInTheDocument();
    expect(screen.queryByText('Hogares')).not.toBeInTheDocument();
  });

  it('renderiza enlaces completos cuando el usuario está autenticado', () => {
    const mockUser: UserProfile = {
      id: 'u1',
      email: 'user@test.com',
      nickname: 'testuser',
      firstName: 'Test',
      lastName1: null,
      lastName2: null,
      phone: '123456789',
      profilePicUrl: null,
      role: 'USER',
      createdAt: '2024-01-01',
    };

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('Mensajes')).toBeInTheDocument();
    expect(screen.getByText('Hogares')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.queryByText('Entrar')).not.toBeInTheDocument();
  });

  it('renderiza enlace al Panel de moderación si el usuario es ADMIN', () => {
    const mockAdmin: UserProfile = {
      id: 'admin1',
      email: 'admin@test.com',
      nickname: 'admin',
      firstName: 'Admin',
      lastName1: null,
      lastName2: null,
      phone: '987654321',
      profilePicUrl: null,
      role: 'ADMIN',
      createdAt: '2024-01-01',
    };

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockAdmin,
      token: 'jwt-admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.queryByText('Mensajes')).not.toBeInTheDocument();
    expect(screen.queryByText('Hogares')).not.toBeInTheDocument();
  });
});
