import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeDetailPage } from './HomeDetailPage';
import { useHomeDetail } from '../features/home/hooks/useHomeDetail';
import { useAuth } from '../features/auth/context/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../features/home/hooks/useHomeDetail');
vi.mock('../features/home/hooks/useHomeExpenses', () => ({
  useHomeExpenses: () => ({
    expenses: [],
    balances: [],
    transfers: [],
    myBalance: 0,
    totalExpensesAmount: 0,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
}));
vi.mock('../features/auth/context/AuthContext');

describe('HomeDetailPage', () => {
  const mockHomeDetail = {
    home: {
      id: 'h1',
      name: 'Piso Retiro',
      invitationCode: 'RETIRO12',
      myRole: 'ADMIN' as const,
      myStatus: 'ACTIVE' as const,
      totalActiveMembers: 2,
      createdAt: '2026-01-01T00:00:00Z',
      members: [
        {
          userId: 'u1',
          fullName: 'Víctor Admin',
          email: 'victor@test.com',
          role: 'ADMIN' as const,
          status: 'ACTIVE' as const,
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ],
    },
    isLoading: false,
    error: null,
    isAdmin: true,
    isActiveMember: true,
    isLeftMember: false,
    isArchivedMember: false,
    activeMembers: [],
    leftMembers: [],
    activeAdminsCount: 1,
    isSoleActiveMember: true,
    isOnlyAdminWithOtherMembers: false,
    canLeaveWithoutTransfer: true,
    refetch: vi.fn(),
    regenerateInvitationCode: vi.fn(),
    transferAdmin: vi.fn(),
    expelMember: vi.fn(),
    forceExpelMember: vi.fn(),
    leaveHome: vi.fn(),
    deleteHome: vi.fn(),
    archiveHome: vi.fn(),
    unarchiveHome: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHomeDetail).mockReturnValue(mockHomeDetail);
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

  it('renderiza encabezado del hogar y pestañas', () => {
    render(
      <MemoryRouter initialEntries={['/homes/h1']}>
        <Routes>
          <Route path="/homes/:id" element={<HomeDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Piso Retiro')).toBeInTheDocument();
    expect(screen.getByText('Miembros (1)')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Actividad y Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Ajustes del Hogar')).toBeInTheDocument();
  });

  it('permite conmutar a la pestaña de gastos', () => {
    render(
      <MemoryRouter initialEntries={['/homes/h1']}>
        <Routes>
          <Route path="/homes/:id" element={<HomeDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const expensesTab = screen.getByText('Gastos');
    fireEvent.click(expensesTab);

    expect(screen.getByText('Gastos Compartidos')).toBeInTheDocument();
  });

  it('permite conmutar a la pestaña de ajustes', () => {
    render(
      <MemoryRouter initialEntries={['/homes/h1']}>
        <Routes>
          <Route path="/homes/:id" element={<HomeDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const settingsTab = screen.getByText('Ajustes del Hogar');
    fireEvent.click(settingsTab);

    expect(screen.getByText('Código de Invitación del Hogar')).toBeInTheDocument();
    expect(screen.getByText('Zona de Peligro')).toBeInTheDocument();
  });
});
