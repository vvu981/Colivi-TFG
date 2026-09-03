import { useState, useEffect, useCallback } from 'react';
import { homeService } from '../api/homeService';
import type { HomeMemberStatus, HomeResponseDto, CreateHomeRequest, JoinHomeRequest } from '../types';

export interface UseHomesReturn {
  homes: HomeResponseDto[];
  statusFilter: HomeMemberStatus;
  setStatusFilter: (status: HomeMemberStatus) => void;
  isLoading: boolean;
  error: string | null;
  counts: Record<HomeMemberStatus, number>;
  refetch: () => Promise<void>;
  createHome: (data: CreateHomeRequest) => Promise<HomeResponseDto>;
  joinHome: (data: JoinHomeRequest) => Promise<HomeResponseDto>;
  leaveHome: (homeId: string) => Promise<void>;
  archiveHome: (homeId: string) => Promise<void>;
  unarchiveHome: (homeId: string) => Promise<void>;
}

export function useHomes(initialStatus: HomeMemberStatus = 'ACTIVE'): UseHomesReturn {
  const [statusFilter, setStatusFilter] = useState<HomeMemberStatus>(initialStatus);
  const [homes, setHomes] = useState<HomeResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<HomeMemberStatus, number>>({
    ACTIVE: 0,
    LEFT: 0,
    ARCHIVED: 0,
  });

  const fetchHomesAndCounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Obtenemos todos los hogares del usuario para calcular los contadores por pestaña
      const allHomes = await homeService.getUserHomes();
      
      const newCounts: Record<HomeMemberStatus, number> = {
        ACTIVE: 0,
        LEFT: 0,
        ARCHIVED: 0,
      };

      allHomes.forEach((home) => {
        if (home.myStatus && newCounts[home.myStatus] !== undefined) {
          newCounts[home.myStatus]++;
        }
      });

      setCounts(newCounts);

      // Filtramos según la pestaña activa
      const filtered = allHomes.filter((h) => h.myStatus === statusFilter);
      setHomes(filtered);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los hogares';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHomesAndCounts();
  }, [fetchHomesAndCounts]);

  const handleCreateHome = async (data: CreateHomeRequest): Promise<HomeResponseDto> => {
    const detail = await homeService.createHome(data);
    await fetchHomesAndCounts();
    return {
      id: detail.id,
      name: detail.name,
      invitationCode: detail.invitationCode,
      myRole: detail.myRole,
      myStatus: detail.myStatus,
      totalActiveMembers: detail.totalActiveMembers,
      createdAt: detail.createdAt,
    };
  };

  const handleJoinHome = async (data: JoinHomeRequest): Promise<HomeResponseDto> => {
    const detail = await homeService.joinHome(data);
    await fetchHomesAndCounts();
    return {
      id: detail.id,
      name: detail.name,
      invitationCode: detail.invitationCode,
      myRole: detail.myRole,
      myStatus: detail.myStatus,
      totalActiveMembers: detail.totalActiveMembers,
      createdAt: detail.createdAt,
    };
  };

  const handleLeaveHome = async (homeId: string): Promise<void> => {
    await homeService.leaveHome(homeId);
    await fetchHomesAndCounts();
  };

  const handleArchiveHome = async (homeId: string): Promise<void> => {
    await homeService.archiveHome(homeId);
    await fetchHomesAndCounts();
  };

  const handleUnarchiveHome = async (homeId: string): Promise<void> => {
    await homeService.unarchiveHome(homeId);
    await fetchHomesAndCounts();
  };

  return {
    homes,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    counts,
    refetch: fetchHomesAndCounts,
    createHome: handleCreateHome,
    joinHome: handleJoinHome,
    leaveHome: handleLeaveHome,
    archiveHome: handleArchiveHome,
    unarchiveHome: handleUnarchiveHome,
  };
}
