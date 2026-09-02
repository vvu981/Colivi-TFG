import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { adminUserService } from './adminUserService';

vi.mock('../../../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchUsers calls /admin/users with query, role and pagination parameters', async () => {
    const mockPage = {
      content: [{ id: 'u-1', email: 'admin@colivi.com', role: 'ADMIN' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const result = await adminUserService.searchUsers('admin', 'ADMIN', false, false, 0, 10);

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users?query=admin&role=ADMIN&banned=false&deleted=false&page=0&size=10')
    );
    expect(result).toEqual(mockPage);
  });

  it('getAdminUserProfile calls /users/admin/:id', async () => {
    const mockProfile = { id: 'u-1', email: 'test@colivi.com', role: 'USER' };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile });

    const result = await adminUserService.getAdminUserProfile('u-1');

    expect(api.get).toHaveBeenCalledWith('/users/admin/u-1');
    expect(result).toEqual(mockProfile);
  });

  it('banUser calls PATCH /users/:id/ban with payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminUserService.banUser('u-1', {
      message: 'Infracción grave',
      bannedUntil: '2026-10-01T00:00:00Z',
    });

    expect(api.patch).toHaveBeenCalledWith('/users/u-1/ban', {
      message: 'Infracción grave',
      bannedUntil: '2026-10-01T00:00:00Z',
    });
  });

  it('unbanUser calls PATCH /users/:id/unban', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminUserService.unbanUser('u-1');

    expect(api.patch).toHaveBeenCalledWith('/users/u-1/unban');
  });

  it('deleteUserHard calls DELETE /users/hard/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    await adminUserService.deleteUserHard('u-1');

    expect(api.delete).toHaveBeenCalledWith('/users/hard/u-1');
  });

  it('setAdmin calls PATCH /users/:id/admin', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminUserService.setAdmin('u-1');

    expect(api.patch).toHaveBeenCalledWith('/users/u-1/admin');
  });
});
