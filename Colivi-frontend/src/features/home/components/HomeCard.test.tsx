import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeCard } from './HomeCard';
import type { HomeResponseDto } from '../types';

describe('HomeCard component', () => {
  const mockHome: HomeResponseDto = {
    id: 'h1',
    name: 'Piso Sol',
    invitationCode: 'SOL12345',
    myRole: 'ADMIN',
    myStatus: 'ACTIVE',
    totalActiveMembers: 3,
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('renderiza información del hogar y badges correctamente', () => {
    const onOpenDetail = vi.fn();
    render(<HomeCard home={mockHome} onOpenDetail={onOpenDetail} />);

    expect(screen.getByText('Piso Sol')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText(/3 miembros/)).toBeInTheDocument();
    expect(screen.getByText('SOL12345')).toBeInTheDocument();
  });

  it('permite abrir el detalle al hacer click en la tarjeta o botón', () => {
    const onOpenDetail = vi.fn();
    render(<HomeCard home={mockHome} onOpenDetail={onOpenDetail} />);

    const enterBtn = screen.getByText('Entrar al Hogar');
    fireEvent.click(enterBtn);

    expect(onOpenDetail).toHaveBeenCalledWith('h1');
  });

  it('permite accionar el modal de invitar', () => {
    const onInvite = vi.fn();
    render(<HomeCard home={mockHome} onOpenDetail={vi.fn()} onInvite={onInvite} />);

    const inviteBtn = screen.getByTitle('Invitar miembros');
    fireEvent.click(inviteBtn);

    expect(onInvite).toHaveBeenCalledWith(mockHome);
  });
});
