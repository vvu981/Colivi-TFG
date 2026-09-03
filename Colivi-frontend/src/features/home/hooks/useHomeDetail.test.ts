import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHomeDetail } from './useHomeDetail';
import { homeService } from '../api/homeService';
import type { HomeDetailResponseDto } from '../types';

vi.mock('../api/homeService', () => ({
  homeService: {
    getHomeDetail: vi.fn(),
    regenerateInvitationCode: vi.fn(),
    transferAdmin: vi.fn(),
    expelMember: vi.fn(),
    forceExpelMember: vi.fn(),
    leaveHome: vi.fn(),
    deleteHome: vi.fn(),
    archiveHome: vi.fn(),
    unarchiveHome: vi.fn(),
  },
}));

describe('useHomeDetail hook', () => {
  const mockDetail: HomeDetailResponseDto = {
    id: 'h1',
    name: 'Casa Principal',
    invitationCode: 'CASA1234',
    myRole: 'ADMIN',
    myStatus: 'ACTIVE',
    totalActiveMembers: 2,
    createdAt: '2026-01-01T00:00:00Z',
    members: [
      {
        userId: 'u1',
        fullName: 'Admin User',
        email: 'admin@test.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00Z',
      },
      {
        userId: 'u2',
        fullName: 'Member User',
        email: 'member@test.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2026-01-02T00:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(homeService.getHomeDetail).mockResolvedValue(mockDetail);
  });

  it('calcula permisos y clasifica miembros activos', async () => {
    const { result } = renderHook(() => useHomeDetail('h1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isActiveMember).toBe(true);
    expect(result.current.activeMembers).toHaveLength(2);
    expect(result.current.activeAdminsCount).toBe(1);
    expect(result.current.isSoleActiveMember).toBe(false);
    expect(result.current.isOnlyAdminWithOtherMembers).toBe(true);
    expect(result.current.canLeaveWithoutTransfer).toBe(false);
  });

  it('permite regenerar el código de invitación', async () => {
    const updated = { ...mockDetail, invitationCode: 'NEW99999' };
    vi.mocked(homeService.regenerateInvitationCode).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useHomeDetail('h1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let newCode = '';
    await act(async () => {
      newCode = await result.current.regenerateInvitationCode();
    });

    expect(homeService.regenerateInvitationCode).toHaveBeenCalledWith('h1');
    expect(newCode).toBe('NEW99999');
    expect(result.current.home?.invitationCode).toBe('NEW99999');
  });

  it('permite ejecutar transferAdmin y expelMember', async () => {
    vi.mocked(homeService.transferAdmin).mockResolvedValueOnce();
    vi.mocked(homeService.expelMember).mockResolvedValueOnce();

    const { result } = renderHook(() => useHomeDetail('h1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.transferAdmin('u2');
    });
    expect(homeService.transferAdmin).toHaveBeenCalledWith('h1', 'u2');

    await act(async () => {
      await result.current.expelMember('u2');
    });
    expect(homeService.expelMember).toHaveBeenCalledWith('h1', 'u2');
  });
});
