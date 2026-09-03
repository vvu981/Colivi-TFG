import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeMemberList } from './HomeMemberList';
import type { HomeMemberResponseDto } from '../types';
import { MemoryRouter } from 'react-router-dom';

describe('HomeMemberList', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'u1',
      fullName: 'Carlos García',
      email: 'carlos@test.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01T00:00:00Z',
    },
    {
      userId: 'u2',
      fullName: 'Lucía Pérez',
      email: 'lucia@test.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-02T00:00:00Z',
    },
  ];

  it('renderiza la lista de miembros con nombres y roles', () => {
    render(
      <MemoryRouter>
        <HomeMemberList
          members={mockMembers}
          isAdmin={true}
          currentUserId="u1"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Carlos García')).toBeInTheDocument();
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument();
    expect(screen.getByText('Tú')).toBeInTheDocument();
    expect(screen.getByText('Miembros Activos (2)')).toBeInTheDocument();
  });

  it('despliega menú de opciones para el admin y permite transferir o expulsar', () => {
    const onTransferAdmin = vi.fn();
    const onExpelMember = vi.fn();

    render(
      <MemoryRouter>
        <HomeMemberList
          members={mockMembers}
          isAdmin={true}
          currentUserId="u1"
          onTransferAdmin={onTransferAdmin}
          onExpelMember={onExpelMember}
        />
      </MemoryRouter>
    );

    const actionMenuBtn = screen.getByLabelText('Acciones para Lucía Pérez');
    fireEvent.click(actionMenuBtn);

    const transferBtn = screen.getByText('Transferir Admin');
    fireEvent.click(transferBtn);
    expect(onTransferAdmin).toHaveBeenCalledWith(mockMembers[1]);
  });

  it('renderiza la imagen de perfil cuando el miembro dispone de profilePicUrl', () => {
    const memberWithPic: HomeMemberResponseDto[] = [
      {
        userId: 'u3',
        fullName: 'Elena Rivas',
        email: 'elena@test.com',
        profilePicUrl: 'https://images.example.com/elena.jpg',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00Z',
      },
    ];

    render(
      <MemoryRouter>
        <HomeMemberList
          members={memberWithPic}
          isAdmin={false}
        />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Elena Rivas');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://images.example.com/elena.jpg');
  });
});
