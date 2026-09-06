import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChoreCalendarView } from './ChoreCalendarView';
import type { ChoreResponseDto } from '../types';

describe('ChoreCalendarView', () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const day15Str = `${currentYear}-${currentMonthStr}-15`;

  const mockChores: ChoreResponseDto[] = [
    {
      id: 'chore-cal-1',
      seriesId: null,
      homeId: 'home-1',
      title: 'Limpiar baño',
      description: 'Limpiar ducha y lavabo',
      assigneeId: 'user-1',
      assigneeName: 'Ana García',
      assigneeAvatar: null,
      completedById: 'user-2',
      completedByName: 'Borja Martín',
      completedByAvatar: null,
      basePoints: 20,
      dueDate: day15Str,
      status: 'COMPLETED',
      completedAt: `${day15Str}T12:00:00`,
      createdAt: `${day15Str}T10:00:00`,
      isLate: false,
      canRescue: false,
      canComplete: false,
    },
  ];

  it('renders calendar days, opens modal on day click and renders profile links', () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();

    render(
      <MemoryRouter>
        <ChoreCalendarView
          chores={mockChores}
          selectedUserId={null}
          onComplete={onComplete}
          onDelete={onDelete}
          currentUserId="user-2"
        />
      </MemoryRouter>
    );

    // Chore title should be visible in day 15 cell
    expect(screen.getByText('Limpiar baño')).toBeInTheDocument();

    // Click on the chore or the day cell to open the modal
    const chorePill = screen.getByText('Limpiar baño');
    fireEvent.click(chorePill);

    // Modal opens
    expect(screen.getByText(new RegExp(`Tareas del ${day15Str}`, 'i'))).toBeInTheDocument();

    // Verify assignee link
    const assigneeLink = screen.getByRole('link', { name: /Ana García/i });
    expect(assigneeLink).toHaveAttribute('href', '/users/user-1');

    // Verify completedBy link
    const completedByLink = screen.getByRole('link', { name: /Borja Martín/i });
    expect(completedByLink).toHaveAttribute('href', '/users/user-2');
  });

  it('filters visible calendar chores when selectedUserId is provided', () => {
    const multiUserChores: ChoreResponseDto[] = [
      ...mockChores,
      {
        id: 'chore-cal-2',
        seriesId: null,
        homeId: 'home-1',
        title: 'Bajar basura',
        description: null,
        assigneeId: 'user-2',
        assigneeName: 'Borja Martín',
        assigneeAvatar: null,
        completedById: null,
        completedByName: null,
        completedByAvatar: null,
        basePoints: 10,
        dueDate: day15Str,
        status: 'PENDING',
        completedAt: null,
        createdAt: `${day15Str}T10:00:00`,
        isLate: false,
        canRescue: false,
        canComplete: true,
      },
    ];

    render(
      <MemoryRouter>
        <ChoreCalendarView
          chores={multiUserChores}
          selectedUserId="user-2"
          onComplete={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    );

    // Only user-2's chore should be visible
    expect(screen.getByText('Bajar basura')).toBeInTheDocument();
    expect(screen.queryByText('Limpiar baño')).not.toBeInTheDocument();
  });
});
