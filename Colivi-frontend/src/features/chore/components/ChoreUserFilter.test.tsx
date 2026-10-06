import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoreUserFilter } from './ChoreUserFilter';
import type { HomeMemberResponseDto } from '../../home/types';

describe('ChoreUserFilter', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'user-1',
      fullName: 'Ana García',
      email: 'ana@test.com',
      profilePicUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
    {
      userId: 'user-2',
      fullName: 'Borja Martín',
      email: 'borja@test.com',
      profilePicUrl: 'https://example.com/borja.jpg',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
  ];

  it('renders dropdown trigger, opens popover and allows selecting member or all', () => {
    const onSelectUser = vi.fn();

    const { rerender } = render(
      <ChoreUserFilter
        members={mockMembers}
        selectedUserId={null}
        onSelectUser={onSelectUser}
        pendingCountsByUserId={{ 'user-1': 3, 'user-2': 1 }}
      />
    );

    // Initial closed state: shows "Todos los miembros" and total pending count (4)
    const trigger = screen.getByRole('button', { name: /Filtrar por miembro/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('Todos los miembros')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Borja Martín')).toBeInTheDocument();

    // Select Ana García
    fireEvent.click(screen.getByText('Ana García'));
    expect(onSelectUser).toHaveBeenCalledWith('user-1');

    // Rerender with selected user Ana García
    rerender(
      <ChoreUserFilter
        members={mockMembers}
        selectedUserId="user-1"
        onSelectUser={onSelectUser}
        pendingCountsByUserId={{ 'user-1': 3, 'user-2': 1 }}
      />
    );

    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Open dropdown again and select "Todos los miembros"
    fireEvent.click(trigger);
    const allOption = screen.getByText('Todos los miembros');
    fireEvent.click(allOption);
    expect(onSelectUser).toHaveBeenCalledWith(null);
  });
});
