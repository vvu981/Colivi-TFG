import api from '../../../lib/api';
import type { AdminUserProfile, BanUserRequest, PageResponse } from '../types/admin.types';

export const adminUserService = {
  /**
   * Lists and searches users for administration with pagination and filters.
   */
  searchUsers: async (
    query?: string,
    role?: string,
    banned?: boolean,
    deleted?: boolean,
    page = 0,
    size = 10
  ): Promise<PageResponse<AdminUserProfile>> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (role) params.append('role', role);
    if (banned !== undefined) params.append('banned', String(banned));
    if (deleted !== undefined) params.append('deleted', String(deleted));
    params.append('page', page.toString());
    params.append('size', size.toString());

    const { data } = await api.get<PageResponse<AdminUserProfile>>(
      `/admin/users?${params.toString()}`
    );
    return data;
  },

  /**
   * Retrieves full admin user profile (with ban, deletion, email, phone info).
   */
  getAdminUserProfile: async (userId: string): Promise<AdminUserProfile> => {
    const { data } = await api.get<AdminUserProfile>(`/users/admin/${userId}`);
    return data;
  },

  /**
   * Bans a user with a reason and optional expiration date.
   */
  banUser: async (userId: string, payload: BanUserRequest): Promise<void> => {
    await api.patch(`/users/${userId}/ban`, payload);
  },

  /**
   * Unbans a previously banned user.
   */
  unbanUser: async (userId: string): Promise<void> => {
    await api.patch(`/users/${userId}/unban`);
  },

  /**
   * Irreversibly hard deletes a user and associated data.
   */
  deleteUserHard: async (userId: string): Promise<void> => {
    await api.delete(`/users/hard/${userId}`);
  },

  /**
   * Grants ADMIN role to a user.
   */
  setAdmin: async (userId: string): Promise<void> => {
    await api.patch(`/users/${userId}/admin`);
  },
};
