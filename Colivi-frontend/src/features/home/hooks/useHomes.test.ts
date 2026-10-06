import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHomes } from './useHomes';
import { homeService } from '../api/homeService';
import type { HomeResponseDto, HomeDetailResponseDto } from '../types';

vi.mock('../api/homeService', () => ({
  homeService: {
    getUserHomes: vi.fn(),
    createHome: vi.fn(),
    joinHome: vi.fn(),
    leaveHome: vi.fn(),
    archiveHome: vi.fn(),
    unarchiveHome: vi.fn(),
  },
}));

describe('useHomes hook', () => {
  const mockHomes: HomeResponseDto[] = [
    {
      id: 'h1',
      name: 'Piso Activo',
      invitationCode: 'ACTIVO12',
      myRole: 'ADMIN',
      myStatus: 'ACTIVE',
      totalActiveMembers: 2,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'h2',
      name: 'Piso Salido',
      invitationCode: 'SALIDO12',
      myRole: 'MEMBER',
      myStatus: 'LEFT',
      totalActiveMembers: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'h3',
      name: 'Piso Archivado',
      invitationCode: 'ARCHIV12',
      myRole: 'MEMBER',
      myStatus: 'ARCHIVED',
      totalActiveMembers: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(homeService.getUserHomes).mockResolvedValue(mockHomes);
  });

  it('calcula correctamente los contadores por pestaña y filtra por estado activo inicial', async () => {
    const { result } = renderHook(() => useHomes('ACTIVE'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.counts).toEqual({
      ACTIVE: 1,
      LEFT: 1,
      ARCHIVED: 1,
    });
    expect(result.current.homes).toHaveLength(1);
    expect(result.current.homes[0].id).toBe('h1');
  });

  it('permite cambiar la pestaña activa y filtra los hogares en consecuencia', async () => {
    const { result } = renderHook(() => useHomes('ACTIVE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter('LEFT');
    });

    await waitFor(() => {
      expect(result.current.homes).toHaveLength(1);
      expect(result.current.homes[0].id).toBe('h2');
    });
  });

  it('ejecuta createHome y refresca la lista', async () => {
    const createdDetail: HomeDetailResponseDto = {
      id: 'h4',
      name: 'Piso Nuevo',
      invitationCode: 'NUEVO123',
      myRole: 'ADMIN',
      myStatus: 'ACTIVE',
      totalActiveMembers: 1,
      createdAt: '2026-01-01T00:00:00Z',
      members: [],
    };
    vi.mocked(homeService.createHome).mockResolvedValueOnce(createdDetail);

    const { result } = renderHook(() => useHomes('ACTIVE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let res: HomeResponseDto | null = null;
    await act(async () => {
      res = await result.current.createHome({ name: 'Piso Nuevo' });
    });

    expect(homeService.createHome).toHaveBeenCalledWith({ name: 'Piso Nuevo' });
    expect((res as unknown as HomeResponseDto)?.id).toBe('h4');
  });
});
