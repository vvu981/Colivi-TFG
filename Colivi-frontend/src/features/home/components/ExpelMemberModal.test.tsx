import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpelMemberModal } from './ExpelMemberModal';
import type { HomeMemberResponseDto } from '../types';

describe('ExpelMemberModal', () => {
  const mockMember: HomeMemberResponseDto = {
    userId: 'u2',
    fullName: 'Miembro Expulsar',
    email: 'expulsar@test.com',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00Z',
  };

  it('permite ejecutar expulsión estándar', async () => {
    const onExpel = vi.fn().mockResolvedValue(undefined);
    const onForceExpel = vi.fn();
    const onClose = vi.fn();

    render(
      <ExpelMemberModal
        isOpen={true}
        onClose={onClose}
        member={mockMember}
        onExpel={onExpel}
        onForceExpel={onForceExpel}
      />
    );

    expect(screen.getAllByText(/Miembro Expulsar/)[0]).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Confirmar Expulsión/i });
    fireEvent.click(submitBtn);

    expect(onExpel).toHaveBeenCalledWith('u2');
  });

  it('permite conmutar a expulsión forzosa con motivo', async () => {
    const onExpel = vi.fn();
    const onForceExpel = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ExpelMemberModal
        isOpen={true}
        onClose={onClose}
        member={mockMember}
        onExpel={onExpel}
        onForceExpel={onForceExpel}
      />
    );

    const forceTab = screen.getByText('Forzosa (Con Deuda)');
    fireEvent.click(forceTab);

    const reasonInput = screen.getByPlaceholderText(/Impago reiterado/);
    fireEvent.change(reasonInput, { target: { value: 'Dejó de pagar el alquiler' } });

    const submitBtn = screen.getByRole('button', { name: /Forzar Expulsión/i });
    fireEvent.click(submitBtn);

    expect(onForceExpel).toHaveBeenCalledWith('u2', 'Dejó de pagar el alquiler');
  });
});
