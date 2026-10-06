import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchivedHomesPage } from './ArchivedHomesPage';
import { useHomes } from '../features/home/hooks/useHomes';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

vi.mock('../features/home/hooks/useHomes');
vi.mock('../features/auth/context/AuthContext');

describe('ArchivedHomesPage', () => {
  const mockUseHomes = {
    homes: [
      {
        id: 'h-archived-1',
        name: 'Piso Erasmus Bolonia',
        invitationCode: 'BOLO1234',
        myRole: 'MEMBER' as const,
        myStatus: 'ARCHIVED' as const,
        totalActiveMembers: 3,
        createdAt: '2025-09-01T00:00:00Z',
      },
    ],
    statusFilter: 'ARCHIVED' as const,
    setStatusFilter: vi.fn(),
    isLoading: false,
    error: null,
    counts: { ACTIVE: 1, LEFT: 1, ARCHIVED: 1 },
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
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renderiza encabezado de hogares archivados y listado', () => {
    render(
      <MemoryRouter>
        <ArchivedHomesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Hogares Archivados')).toBeInTheDocument();
    expect(screen.getByText('Piso Erasmus Bolonia')).toBeInTheDocument();
    expect(screen.getByText('Desarchivar')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay hogares archivados', () => {
    vi.mocked(useHomes).mockReturnValue({
      ...mockUseHomes,
      homes: [],
    });

    render(
      <MemoryRouter>
        <ArchivedHomesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No tienes hogares archivados')).toBeInTheDocument();
    expect(screen.getByText('Ir a Mis Hogares')).toBeInTheDocument();
  });

  it('permite buscar y filtrar hogares archivados localmente', () => {
    render(
      <MemoryRouter>
        <ArchivedHomesPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar en archivados/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.queryByText('Piso Erasmus Bolonia')).not.toBeInTheDocument();
    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });
});
