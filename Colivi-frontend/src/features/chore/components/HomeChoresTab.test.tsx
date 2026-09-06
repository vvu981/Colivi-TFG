import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeChoresTab } from './HomeChoresTab';
import { choreService } from '../api/choreService';
import { homeService } from '../../home/api/homeService';
import type { HomeDetailResponseDto } from '../../home/types';
import type { ChoreResponseDto, ChoreLeaderboardDto } from '../types';

vi.mock('../api/choreService');
vi.mock('../../home/api/homeService', () => ({
  homeService: {
    updateMyMemberColor: vi.fn(),
  },
}));

describe('HomeChoresTab', () => {
  let queryClient: QueryClient;

  const mockHome: HomeDetailResponseDto = {
    id: 'h1',
    name: 'Piso Malasaña',
    invitationCode: 'MALA1234',
    myRole: 'MEMBER',
    myStatus: 'ACTIVE',
    totalActiveMembers: 2,
    createdAt: '2026-01-01T00:00:00Z',
    members: [
      {
        userId: 'u1',
        fullName: 'Carlos Residente',
        email: 'carlos@test.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00Z',
      },
      {
        userId: 'u2',
        fullName: 'Lucía Residente',
        email: 'lucia@test.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2026-01-02T00:00:00Z',
      },
    ],
  };

  const mockChores: ChoreResponseDto[] = [
    {
      id: 'c1',
      seriesId: null,
      homeId: 'h1',
      title: 'Limpiar la cocina',
      description: 'Fregar suelo y encimeras',
      assigneeId: 'u1',
      assigneeName: 'Carlos Residente',
      assigneeAvatar: null,
      completedById: null,
      completedByName: null,
      completedByAvatar: null,
      basePoints: 15,
      dueDate: '2026-09-10',
      status: 'PENDING',
      completedAt: null,
      createdAt: '2026-09-01T10:00:00Z',
      isLate: false,
      canRescue: false,
      canComplete: true,
    },
  ];

  const mockLeaderboard: ChoreLeaderboardDto = {
    period: 'WEEKLY',
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    scores: [
      {
        userId: 'u1',
        nickname: 'carlos',
        fullName: 'Carlos Residente',
        profilePicUrl: null,
        currentPoints: 30,
        expectedPoints: 45,
        completedCount: 2,
        rescuedCount: 0,
        penalizedCount: 0,
        pendingCount: 1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(choreService.getChores).mockResolvedValue(mockChores);
    vi.mocked(choreService.getLeaderboard).mockResolvedValue(mockLeaderboard);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HomeChoresTab home={mockHome} currentUserId="u1" />
        </QueryClientProvider>
      </MemoryRouter>
    );

  it('renders tab header, control buttons and switches view correctly', async () => {
    renderComponent();

    expect(screen.getByText('Tareas Domésticas Gamificadas')).toBeInTheDocument();
    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();

    // Switch to List view
    const listButton = screen.getByRole('button', { name: /Lista/i });
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(screen.getByText('Limpiar la cocina')).toBeInTheDocument();
    });
  });

  it('opens create chore modal when clicking Nueva Tarea button', async () => {
    renderComponent();

    const createBtn = screen.getByRole('button', { name: /Nueva Tarea/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Nueva Tarea Doméstica')).toBeInTheDocument();
  });

  it('renders filter dropdown in top card section and filters chores', async () => {
    renderComponent();

    // The filter button is in the top card section
    const filterBtn = screen.getByRole('button', { name: /Abrir filtros acumulables/i });
    expect(filterBtn).toBeInTheDocument();

    // Open filter dropdown
    fireEvent.click(filterBtn);
    expect(screen.getByText('Filtros Acumulables')).toBeInTheDocument();

    // Select "Completadas"
    const completedFilterBtn = screen.getByRole('button', { name: /^Completadas/i });
    fireEvent.click(completedFilterBtn);

    // Apply
    const applyBtn = screen.getByRole('button', { name: /Aplicar/i });
    fireEvent.click(applyBtn);

    // Active chip is rendered in the top card
    expect(screen.getByText(/Estado: Completadas/i)).toBeInTheDocument();

    // In calendar view, pending chore "Limpiar la cocina" is filtered out
    expect(screen.queryByText('Limpiar la cocina')).not.toBeInTheDocument();

    // Switch to List view
    const listBtn = screen.getByRole('button', { name: /Lista/i });
    fireEvent.click(listBtn);

    // In list view, pending chore "Limpiar la cocina" is also filtered out
    expect(screen.queryByText('Limpiar la cocina')).not.toBeInTheDocument();
  });

  it('updates personal color button indicator immediately and notifies onHomeUpdate when color is changed', async () => {
    const mockOnHomeUpdate = vi.fn();
    vi.mocked(homeService.updateMyMemberColor).mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HomeChoresTab home={mockHome} currentUserId="u1" onHomeUpdate={mockOnHomeUpdate} />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Initial color indicator in "Mi color" button
    const colorDot = screen.getByTestId('my-color-dot');
    expect(colorDot).toBeInTheDocument();

    // Open personal color modal
    const myColorBtn = screen.getByRole('button', { name: /Mi color/i });
    fireEvent.click(myColorBtn);

    expect(screen.getByText('Mi color en el hogar')).toBeInTheDocument();

    // Select "Esmeralda" (#059669)
    const emeraldBtn = screen.getByTitle('Esmeralda');
    fireEvent.click(emeraldBtn);

    // Save
    const saveBtn = screen.getByRole('button', { name: /Guardar color/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(homeService.updateMyMemberColor).toHaveBeenCalledWith('h1', '#059669');
      expect(mockOnHomeUpdate).toHaveBeenCalled();
      expect(colorDot).toHaveStyle({ backgroundColor: 'rgb(5, 150, 105)' });
    });
  });

  it('retains selected filter without reverting to ALL when in list view mode', async () => {
    renderComponent();

    // Switch to list view first
    const listBtn = screen.getByRole('button', { name: /Lista/i });
    fireEvent.click(listBtn);

    await waitFor(() => {
      expect(screen.getByText('Limpiar la cocina')).toBeInTheDocument();
    });

    // Open filter dropdown
    const filterBtn = screen.getByRole('button', { name: /Abrir filtros acumulables/i });
    fireEvent.click(filterBtn);

    // Select "No completadas"
    const pendingFilterBtn = screen.getByRole('button', { name: /^No completadas/i });
    fireEvent.click(pendingFilterBtn);

    // Apply
    const applyBtn = screen.getByRole('button', { name: /Aplicar/i });
    fireEvent.click(applyBtn);

    // Active chip must remain in the document and not reset to ALL
    expect(screen.getByText(/Estado: No completadas/i)).toBeInTheDocument();
    expect(screen.getByText('Limpiar la cocina')).toBeInTheDocument();
  });
});
