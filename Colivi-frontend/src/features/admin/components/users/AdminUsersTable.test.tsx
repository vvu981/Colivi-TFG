import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminUsersTable } from './AdminUsersTable';
import type { AdminUserProfile } from '../../types/admin.types';

describe('AdminUsersTable', () => {
  const mockUsers: AdminUserProfile[] = [
    {
      id: 'user-uuid-1',
      email: 'juan@example.com',
      phone: '+34600000000',
      role: 'USER',
      nickname: 'juanito',
      firstName: 'Juan',
      lastName1: 'Pérez',
      lastName2: 'García',
      profilePicUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      bannedAt: null,
      bannedUntil: null,
      banReason: null,
    },
    {
      id: 'user-uuid-2',
      email: 'banned@example.com',
      phone: null,
      role: 'USER',
      nickname: 'banneduser',
      firstName: 'Banned',
      lastName1: 'User',
      lastName2: null,
      profilePicUrl: null,
      createdAt: '2026-01-02T00:00:00Z',
      deletedAt: null,
      bannedAt: '2026-02-01T00:00:00Z',
      bannedUntil: null,
      banReason: 'Fraude continuado',
    },
  ];

  it('renders users with active and banned badges', () => {
    render(
      <AdminUsersTable
        users={mockUsers}
        pageInfo={{
          content: mockUsers,
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        query=""
        role=""
        banned={undefined}
        deleted={undefined}
        page={0}
        size={10}
        isLoading={false}
        onQueryChange={vi.fn()}
        onRoleChange={vi.fn()}
        onBannedChange={vi.fn()}
        onDeletedChange={vi.fn()}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onBanUser={vi.fn()}
        onUnbanUser={vi.fn()}
        onHardDeleteUser={vi.fn()}
        onSetAdmin={vi.fn()}
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('@juanito')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    expect(screen.getByText('Banned User')).toBeInTheDocument();
    expect(screen.getByText('@banneduser')).toBeInTheDocument();
    expect(screen.getByText('Baneado')).toBeInTheDocument();
  });

  it('opens ban modal when clicking ban button on active user', () => {
    render(
      <AdminUsersTable
        users={mockUsers}
        pageInfo={{
          content: mockUsers,
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        query=""
        role=""
        banned={undefined}
        deleted={undefined}
        page={0}
        size={10}
        isLoading={false}
        onQueryChange={vi.fn()}
        onRoleChange={vi.fn()}
        onBannedChange={vi.fn()}
        onDeletedChange={vi.fn()}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onBanUser={vi.fn()}
        onUnbanUser={vi.fn()}
        onHardDeleteUser={vi.fn()}
        onSetAdmin={vi.fn()}
      />
    );

    const banBtns = screen.getAllByTitle('Banear usuario');
    fireEvent.click(banBtns[0]);

    expect(screen.getByText('Banear Usuario')).toBeInTheDocument();
    expect(screen.getAllByText(/juanito/i).length).toBeGreaterThan(0);
  });

  it('opens confirmation modal when clicking promote to admin button', async () => {
    const handleSetAdmin = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminUsersTable
        users={mockUsers}
        pageInfo={{
          content: mockUsers,
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        query=""
        role=""
        banned={undefined}
        deleted={undefined}
        page={0}
        size={10}
        isLoading={false}
        onQueryChange={vi.fn()}
        onRoleChange={vi.fn()}
        onBannedChange={vi.fn()}
        onDeletedChange={vi.fn()}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onBanUser={vi.fn()}
        onUnbanUser={vi.fn()}
        onHardDeleteUser={vi.fn()}
        onSetAdmin={handleSetAdmin}
      />
    );

    const promoteBtns = screen.getAllByTitle('Promover a Admin');
    fireEvent.click(promoteBtns[0]);

    expect(screen.getByText('¿Promover a Administrador a @juanito?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, otorgar rol ADMIN/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleSetAdmin).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  it('opens confirmation modal when clicking unban user button', async () => {
    const handleUnbanUser = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminUsersTable
        users={mockUsers}
        pageInfo={{
          content: mockUsers,
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        query=""
        role=""
        banned={undefined}
        deleted={undefined}
        page={0}
        size={10}
        isLoading={false}
        onQueryChange={vi.fn()}
        onRoleChange={vi.fn()}
        onBannedChange={vi.fn()}
        onDeletedChange={vi.fn()}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onBanUser={vi.fn()}
        onUnbanUser={handleUnbanUser}
        onHardDeleteUser={vi.fn()}
        onSetAdmin={vi.fn()}
      />
    );

    const unbanBtns = screen.getAllByTitle('Desbanear usuario');
    fireEvent.click(unbanBtns[0]);

    expect(screen.getByText('¿Desbanear a @banneduser?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, desbanear usuario/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleUnbanUser).toHaveBeenCalledWith('user-uuid-2');
    });
  });
});
