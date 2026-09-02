import { useState, useEffect, useCallback } from 'react';
import { adminUserService } from '../services/adminUserService';
import type { AdminUserProfile, BanUserRequest, PageResponse } from '../types/admin.types';

interface UseAdminUsersOptions {
  initialPageSize?: number;
  enabled?: boolean;
}

export const useAdminUsers = (options: UseAdminUsersOptions | number = 10) => {
  const initialPageSize = typeof options === 'number' ? options : options.initialPageSize ?? 10;
  const enabled = typeof options === 'number' ? true : options.enabled ?? true;

  const [usersPage, setUsersPage] = useState<PageResponse<AdminUserProfile> | null>(null);
  const [query, setQuery] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [banned, setBanned] = useState<boolean | undefined>(undefined);
  const [deleted, setDeleted] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(initialPageSize);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<AdminUserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminUserService.searchUsers(query, role, banned, deleted, page, size);
      setUsersPage(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, query, role, banned, deleted, page, size]);

  useEffect(() => {
    if (enabled) {
      fetchUsers();
    }
  }, [enabled, fetchUsers]);

  const inspectUser = async (userId: string): Promise<AdminUserProfile> => {
    try {
      const profile = await adminUserService.getAdminUserProfile(userId);
      setActiveUser(profile);
      return profile;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al cargar perfil de usuario.');
    }
  };

  const banUser = async (userId: string, payload: BanUserRequest) => {
    try {
      await adminUserService.banUser(userId, payload);
      setUsersPage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((item) =>
            item.id === userId
              ? {
                  ...item,
                  bannedAt: new Date().toISOString(),
                  banReason: payload.message,
                  bannedUntil: payload.bannedUntil || null,
                }
              : item
          ),
        };
      });
      if (activeUser?.id === userId) {
        setActiveUser((prev) =>
          prev
            ? {
                ...prev,
                bannedAt: new Date().toISOString(),
                banReason: payload.message,
                bannedUntil: payload.bannedUntil || null,
              }
            : null
        );
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al banear al usuario.');
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await adminUserService.unbanUser(userId);
      setUsersPage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((item) =>
            item.id === userId
              ? {
                  ...item,
                  bannedAt: null,
                  banReason: null,
                  bannedUntil: null,
                }
              : item
          ),
        };
      });
      if (activeUser?.id === userId) {
        setActiveUser((prev) =>
          prev
            ? {
                ...prev,
                bannedAt: null,
                banReason: null,
                bannedUntil: null,
              }
            : null
        );
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al desbanear al usuario.');
    }
  };

  const hardDeleteUser = async (userId: string) => {
    try {
      await adminUserService.deleteUserHard(userId);
      setUsersPage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalElements: Math.max(0, prev.totalElements - 1),
          content: prev.content.filter((item) => item.id !== userId),
        };
      });
      if (activeUser?.id === userId) {
        setActiveUser(null);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar físicamente al usuario.');
    }
  };

  const setAdmin = async (userId: string) => {
    try {
      await adminUserService.setAdmin(userId);
      setUsersPage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((item) =>
            item.id === userId ? { ...item, role: 'ADMIN' as const } : item
          ),
        };
      });
      if (activeUser?.id === userId) {
        setActiveUser((prev) => (prev ? { ...prev, role: 'ADMIN' as const } : null));
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al promover a administrador.');
    }
  };

  return {
    users: usersPage?.content || [],
    pageInfo: usersPage,
    query,
    role,
    banned,
    deleted,
    page,
    size,
    isLoading,
    error,
    activeUser,
    setActiveUser,
    setQuery,
    setRole,
    setBanned,
    setDeleted,
    setPage,
    setSize,
    inspectUser,
    banUser,
    unbanUser,
    hardDeleteUser,
    setAdmin,
    refetch: fetchUsers,
  };
};
