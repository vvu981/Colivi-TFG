import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomesPage } from './HomesPage';
import { useHomes } from '../features/home/hooks/useHomes';
import { MemoryRouter } from 'react-router-dom';

import { useAuth } from '../features/auth/context/AuthContext';

vi.mock('../features/home/hooks/useHomes');
vi.mock('../features/auth/context/AuthContext');

describe('HomesPage', () => {
  const mockUseHomes = {
    homes: [
      {
        id: 'h1',
        name: 'Piso Retiro',
        invitationCode: 'RETIRO12',
        myRole: 'ADMIN' as const,
        myStatus: 'ACTIVE' as const,
        totalActiveMembers: 2,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    statusFilter: 'ACTIVE' as const,
    setStatusFilter: vi.fn(),
    isLoading: false,
    error: null,
    counts: { ACTIVE: 1, LEFT: 0, ARCHIVED: 0 },
    refetch: vi.fn(),
    createHome: vi.fn(),
    joinHome: vi.fn(),
    leaveHome: vi.fn(),
    archiveHome: vi.fn(),
    unarchiveHome: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHomes).mockReturnValue(mockUseHomes);
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'u1',
        email: 'victor@test.com',
        nickname: 'victor',
        role: 'USER',
        firstName: 'Víctor',
        lastName1: 'Vallejo',
        lastName2: 'Uroz',
        phone: '+34600000000',
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renderiza el título, botón de crear y las tarjetas de hogar', () => {
    render(
      <MemoryRouter>
        <HomesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Mis Hogares' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Hogar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unirse con código/i })).toBeInTheDocument();
    expect(screen.getByText('Piso Retiro')).toBeInTheDocument();
  });

  it('abre el modal de crear hogar al pulsar el botón', () => {
    render(
      <MemoryRouter>
        <HomesPage />
      </MemoryRouter>
    );

    const createBtn = screen.getByRole('button', { name: /Crear Hogar/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Crear un Nuevo Hogar')).toBeInTheDocument();
  });

  it('abre el modal de unirse con código al pulsar el botón', () => {
    render(
      <MemoryRouter>
        <HomesPage />
      </MemoryRouter>
    );

    const joinBtn = screen.getByRole('button', { name: /Unirse con código/i });
    fireEvent.click(joinBtn);

    expect(screen.getByText('Unirse a un Hogar')).toBeInTheDocument();
  });
});
