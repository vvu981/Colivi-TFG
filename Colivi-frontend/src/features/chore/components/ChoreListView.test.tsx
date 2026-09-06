import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChoreListView } from './ChoreListView';
import type { ChoreResponseDto } from '../types';

describe('ChoreListView', () => {
  const mockChores: ChoreResponseDto[] = [
    {
      id: 'chore-1',
      seriesId: 'series-1',
      homeId: 'home-1',
      title: 'Limpiar cristales',
      description: 'Salón y habitaciones',
      assigneeId: 'user-1',
      assigneeName: 'Ana García',
      assigneeAvatar: null,
      completedById: null,
      completedByName: null,
      completedByAvatar: null,
      basePoints: 15,
      dueDate: '2026-09-03', // atrasada
      status: 'PENDING',
      completedAt: null,
      createdAt: '2026-09-01T10:00:00',
      isLate: true,
      canRescue: true, // Borja can rescue it
      canComplete: true,
    },
    {
      id: 'chore-2',
      seriesId: null,
      homeId: 'home-1',
      title: 'Sacar basura',
      description: null,
      assigneeId: 'user-2',
      assigneeName: 'Borja Martín',
      assigneeAvatar: null,
      completedById: null,
      completedByName: null,
      completedByAvatar: null,
      basePoints: 10,
      dueDate: '2026-09-10',
      status: 'PENDING',
      completedAt: null,
      createdAt: '2026-09-01T10:00:00',
      isLate: false,
      canRescue: false,
      canComplete: true,
    },
  ];

  it('renders chores, time filter tabs and rescue button for late tasks', () => {
    const onTimeFilterChange = vi.fn();
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(
      <MemoryRouter>
        <ChoreListView
          chores={mockChores}
          timeFilter="ALL"
          onTimeFilterChange={onTimeFilterChange}
          selectedUserId={null}
          onComplete={onComplete}
          onDelete={onDelete}
          currentUserId="user-2" // Borja
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Limpiar cristales')).toBeInTheDocument();
    expect(screen.getByText('+15 pts')).toBeInTheDocument();
    expect(screen.getByText(/¡Atrasada - Rescatable!/i)).toBeInTheDocument();

    // Rescue button is present for late task assigned to Ana
    const rescueBtn = screen.getByRole('button', { name: /¡Rescatar!/i });
    expect(rescueBtn).toBeInTheDocument();
    fireEvent.click(rescueBtn);
    expect(onComplete).toHaveBeenCalledWith(mockChores[0]);

    // Complete button is present for Borja's own on-time task
    const completeBtn = screen.getByRole('button', { name: /^Completar$/i });
    expect(completeBtn).toBeInTheDocument();
    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledWith(mockChores[1]);

    // Open filter dropdown and select "Para rescatar"
    const filterBtn = screen.getByRole('button', { name: /Abrir filtros acumulables/i });
    fireEvent.click(filterBtn);
    const lateFilterBtn = screen.getByRole('button', { name: /^Para rescatar/i });
    fireEvent.click(lateFilterBtn);
    const applyBtn = screen.getByRole('button', { name: /Aplicar/i });
    fireEvent.click(applyBtn);
    expect(onTimeFilterChange).toHaveBeenCalledWith('LATE');
  });

  it('filters chores when selectedUserId is provided', () => {
    render(
      <MemoryRouter>
        <ChoreListView
          chores={mockChores}
          timeFilter="ALL"
          onTimeFilterChange={vi.fn()}
          selectedUserId="user-2" // filter by Borja only
          onComplete={vi.fn()}
          onDelete={vi.fn()}
          currentUserId="user-2"
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Limpiar cristales')).not.toBeInTheDocument();
    expect(screen.getByText('Sacar basura')).toBeInTheDocument();
  });

  it('correctly filters by PENDING, COMPLETED and LATE filters', () => {
    const choresWithCompleted: ChoreResponseDto[] = [
      ...mockChores,
      {
        id: 'chore-3',
        seriesId: null,
        homeId: 'home-1',
        title: 'Fregar sartenes',
        description: null,
        assigneeId: 'user-1',
        assigneeName: 'Ana García',
        assigneeAvatar: null,
        completedById: 'user-1',
        completedByName: 'Ana García',
        completedByAvatar: null,
        basePoints: 5,
        dueDate: '2026-09-02',
        status: 'COMPLETED',
        completedAt: '2026-09-02T12:00:00',
        createdAt: '2026-09-01T10:00:00',
        isLate: false,
        canRescue: false,
        canComplete: false,
      },
    ];

    // Test PENDING
    const { rerender } = render(
      <MemoryRouter>
        <ChoreListView
          chores={choresWithCompleted}
          timeFilter="PENDING"
          onTimeFilterChange={vi.fn()}
          selectedUserId={null}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Limpiar cristales')).toBeInTheDocument();
    expect(screen.getByText('Sacar basura')).toBeInTheDocument();
    expect(screen.queryByText('Fregar sartenes')).not.toBeInTheDocument();

    // Test COMPLETED
    rerender(
      <MemoryRouter>
        <ChoreListView
          chores={choresWithCompleted}
          timeFilter="COMPLETED"
          onTimeFilterChange={vi.fn()}
          selectedUserId={null}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Limpiar cristales')).not.toBeInTheDocument();
    expect(screen.queryByText('Sacar basura')).not.toBeInTheDocument();
    expect(screen.getByText('Fregar sartenes')).toBeInTheDocument();

    // Test LATE (Para rescatar)
    rerender(
      <MemoryRouter>
        <ChoreListView
          chores={choresWithCompleted}
          timeFilter="LATE"
          onTimeFilterChange={vi.fn()}
          selectedUserId={null}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Limpiar cristales')).toBeInTheDocument();
    expect(screen.queryByText('Sacar basura')).not.toBeInTheDocument();
    expect(screen.queryByText('Fregar sartenes')).not.toBeInTheDocument();
  });

  it('supports cumulative filtering via dropdown with custom date range X to Z', () => {
    render(
      <MemoryRouter>
        <ChoreListView
          chores={mockChores}
          selectedUserId={null}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    // Initial state: both chores are displayed
    expect(screen.getByText('Limpiar cristales')).toBeInTheDocument();
    expect(screen.getByText('Sacar basura')).toBeInTheDocument();

    // Open filter dropdown
    const filterBtn = screen.getByRole('button', { name: /Abrir filtros acumulables/i });
    fireEvent.click(filterBtn);

    expect(screen.getByText('Filtros Acumulables')).toBeInTheDocument();

    // Select "Entre fechas (X y Z)"
    const customRangeBtn = screen.getByRole('button', { name: /Entre fechas \(X y Z\)/i });
    fireEvent.click(customRangeBtn);

    // Date range inputs should be visible
    expect(screen.getByText('Desde (Fecha X)')).toBeInTheDocument();
    expect(screen.getByText('Hasta (Fecha Z)')).toBeInTheDocument();

    // Click on start date trigger and pick a day
    const startTrigger = screen.getByLabelText(/Desde \(Fecha X\)/i);
    fireEvent.click(startTrigger);
    // Click on day 9
    const day9Btn = screen.getByRole('button', { name: /^9 de /i });
    fireEvent.click(day9Btn);

    // Click "Aplicar"
    const applyBtn = screen.getByRole('button', { name: /Aplicar/i });
    fireEvent.click(applyBtn);

    // Now due date 2026-09-03 ('Limpiar cristales') is outside range (>= 9 Sept),
    // and 'Sacar basura' (2026-09-10) is inside range!
    expect(screen.queryByText('Limpiar cristales')).not.toBeInTheDocument();
    expect(screen.getByText('Sacar basura')).toBeInTheDocument();

    // Verify active filter chip is visible
    expect(screen.getByText(/Fechas: 2026-09-09/i)).toBeInTheDocument();

    // Click remove date filter chip
    const removeDateChip = screen.getByRole('button', { name: /Quitar filtro de fecha/i });
    fireEvent.click(removeDateChip);

    // Both chores are visible again
    expect(screen.getByText('Limpiar cristales')).toBeInTheDocument();
    expect(screen.getByText('Sacar basura')).toBeInTheDocument();
  });

  it('renders profile links for chore assignee and completedBy user', () => {
    const choresWithCompleted: ChoreResponseDto[] = [
      {
        ...mockChores[0],
        completedById: 'user-2',
        completedByName: 'Borja Martín',
      },
    ];

    render(
      <MemoryRouter>
        <ChoreListView
          chores={choresWithCompleted}
          selectedUserId={null}
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    const assigneeLink = screen.getByRole('link', { name: /Ana García/i });
    expect(assigneeLink).toHaveAttribute('href', '/users/user-1');

    const completedByLink = screen.getByRole('link', { name: /Borja Martín/i });
    expect(completedByLink).toHaveAttribute('href', '/users/user-2');
  });
});


