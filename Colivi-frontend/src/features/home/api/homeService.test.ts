import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { homeService } from './homeService';
import type { HomeDetailResponseDto, HomeResponseDto, Page, ActivityLogResponseDto } from '../types';

vi.mock('../../../lib/api');

describe('homeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUserHomes realiza llamada GET con parámetros de estado', async () => {
    const mockHomes: HomeResponseDto[] = [
      {
        id: 'home-1',
        name: 'Piso Centro',
        invitationCode: 'CODE1234',
        myRole: 'ADMIN',
        myStatus: 'ACTIVE',
        totalActiveMembers: 3,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockHomes });

    const result = await homeService.getUserHomes('ACTIVE');

    expect(api.get).toHaveBeenCalledWith('/homes', { params: { status: 'ACTIVE' } });
    expect(result).toEqual(mockHomes);
  });

  it('getHomeDetail realiza llamada GET por ID', async () => {
    const mockDetail: HomeDetailResponseDto = {
      id: 'home-1',
      name: 'Piso Centro',
      invitationCode: 'CODE1234',
      myRole: 'ADMIN',
      myStatus: 'ACTIVE',
      totalActiveMembers: 1,
      createdAt: '2026-01-01T00:00:00Z',
      members: [],
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDetail });

    const result = await homeService.getHomeDetail('home-1');

    expect(api.get).toHaveBeenCalledWith('/homes/home-1');
    expect(result).toEqual(mockDetail);
  });

  it('createHome realiza llamada POST', async () => {
    const mockDetail: HomeDetailResponseDto = {
      id: 'home-1',
      name: 'Nuevo Piso',
      invitationCode: 'CODE9999',
      myRole: 'ADMIN',
      myStatus: 'ACTIVE',
      totalActiveMembers: 1,
      createdAt: '2026-01-01T00:00:00Z',
      members: [],
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockDetail });

    const result = await homeService.createHome({ name: 'Nuevo Piso' });

    expect(api.post).toHaveBeenCalledWith('/homes', { name: 'Nuevo Piso' });
    expect(result).toEqual(mockDetail);
  });

  it('joinHome realiza llamada POST /homes/join', async () => {
    const mockDetail: HomeDetailResponseDto = {
      id: 'home-2',
      name: 'Piso Amigos',
      invitationCode: 'AMIGOS123',
      myRole: 'MEMBER',
      myStatus: 'ACTIVE',
      totalActiveMembers: 2,
      createdAt: '2026-01-01T00:00:00Z',
      members: [],
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockDetail });

    const result = await homeService.joinHome({ invitationCode: 'AMIGOS123' });

    expect(api.post).toHaveBeenCalledWith('/homes/join', { invitationCode: 'AMIGOS123' });
    expect(result).toEqual(mockDetail);
  });

  it('leaveHome, archiveHome, unarchiveHome realizan las llamadas PATCH correctas', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });

    await homeService.leaveHome('h1');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/leave');

    await homeService.archiveHome('h1');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/archive');

    await homeService.unarchiveHome('h1');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/unarchive');
  });

  it('transferAdmin realiza llamada PATCH con query param', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await homeService.transferAdmin('h1', 'u2');

    expect(api.patch).toHaveBeenCalledWith('/homes/h1/transfer-admin', null, {
      params: { targetUserId: 'u2' },
    });
  });

  it('expelMember y forceExpelMember realizan las llamadas esperadas', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });

    await homeService.expelMember('h1', 'u2');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/members/u2/expel');

    await homeService.forceExpelMember('h1', 'u2', 'Impago');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/members/u2/force-expel', {
      reason: 'Impago',
    });
  });

  it('regenerateInvitationCode realiza PATCH y deleteHome realiza DELETE', async () => {
    const mockDetail = { id: 'h1', invitationCode: 'NEWCODE' } as HomeDetailResponseDto;
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockDetail });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    const regen = await homeService.regenerateInvitationCode('h1');
    expect(api.patch).toHaveBeenCalledWith('/homes/h1/invitation-code/regenerate');
    expect(regen).toEqual(mockDetail);

    await homeService.deleteHome('h1');
    expect(api.delete).toHaveBeenCalledWith('/homes/h1');
  });

  it('getHomeActivities realiza llamada GET paginada', async () => {
    const mockPage: Page<ActivityLogResponseDto> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: true,
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const result = await homeService.getHomeActivities('h1', 1, 10);

    expect(api.get).toHaveBeenCalledWith('/homes/h1/activities', {
      params: { page: 1, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });
});
