import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferAdminModal } from './TransferAdminModal';
import type { HomeMemberResponseDto } from '../types';

describe('TransferAdminModal', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'u1',
      fullName: 'Admin Actual',
      email: 'admin@test.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01T00:00:00Z',
    },
    {
      userId: 'u2',
      fullName: 'Compañero Dos',
      email: 'dos@test.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-02T00:00:00Z',
    },
  ];

  it('permite seleccionar un miembro y transferir el rol', async () => {
    const onTransfer = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <TransferAdminModal
        isOpen={true}
        onClose={onClose}
        activeMembers={mockMembers}
        currentUserId="u1"
        onTransfer={onTransfer}
      />
    );

    expect(screen.getByText('Transferir Administración')).toBeInTheDocument();
    expect(screen.getByText('Compañero Dos')).toBeInTheDocument();

    const radio = screen.getByDisplayValue('u2');
    fireEvent.click(radio);

    const submitBtn = screen.getByRole('button', { name: /Transferir Rol/i });
    fireEvent.click(submitBtn);

    expect(onTransfer).toHaveBeenCalledWith('u2');
  });
});
