import { useState, useEffect, useCallback } from 'react';
import { homeService } from '../api/homeService';
import type { HomeDetailResponseDto, HomeMemberResponseDto } from '../types';

export interface UseHomeDetailReturn {
  home: HomeDetailResponseDto | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isActiveMember: boolean;
  isLeftMember: boolean;
  isArchivedMember: boolean;
  activeMembers: HomeMemberResponseDto[];
  leftMembers: HomeMemberResponseDto[];
  activeAdminsCount: number;
  isSoleActiveMember: boolean;
  isOnlyAdminWithOtherMembers: boolean;
  canLeaveWithoutTransfer: boolean;
  refetch: () => Promise<void>;
  regenerateInvitationCode: () => Promise<string>;
  transferAdmin: (targetUserId: string) => Promise<void>;
  expelMember: (targetUserId: string) => Promise<void>;
  forceExpelMember: (targetUserId: string, reason?: string) => Promise<void>;
  leaveHome: () => Promise<void>;
  deleteHome: () => Promise<void>;
  archiveHome: () => Promise<void>;
  unarchiveHome: () => Promise<void>;
}

export function useHomeDetail(homeId: string | undefined): UseHomeDetailReturn {
  const [home, setHome] = useState<HomeDetailResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!homeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await homeService.getHomeDetail(homeId);
      setHome(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar el detalle del hogar';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [homeId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const isAdmin = home?.myRole === 'ADMIN';
  const isActiveMember = home?.myStatus === 'ACTIVE';
  const isLeftMember = home?.myStatus === 'LEFT';
  const isArchivedMember = home?.myStatus === 'ARCHIVED';

  const activeMembers = home?.members.filter((m) => m.status === 'ACTIVE') ?? [];
  const leftMembers =
    home?.members.filter((m) => m.status === 'LEFT' || m.status === 'ARCHIVED') ?? [];

  const activeAdminsCount = activeMembers.filter((m) => m.role === 'ADMIN').length;
  const isSoleActiveMember = activeMembers.length === 1;
  const isOnlyAdminWithOtherMembers =
    isAdmin && activeAdminsCount === 1 && activeMembers.length > 1;
  const canLeaveWithoutTransfer = !isOnlyAdminWithOtherMembers;

  const handleRegenerateCode = async (): Promise<string> => {
    if (!homeId) throw new Error('Hogar no especificado');
    const updated = await homeService.regenerateInvitationCode(homeId);
    setHome(updated);
    return updated.invitationCode;
  };

  const handleTransferAdmin = async (targetUserId: string): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.transferAdmin(homeId, targetUserId);
    await fetchDetail();
  };

  const handleExpelMember = async (targetUserId: string): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.expelMember(homeId, targetUserId);
    await fetchDetail();
  };

  const handleForceExpelMember = async (
    targetUserId: string,
    reason?: string
  ): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.forceExpelMember(homeId, targetUserId, reason);
    await fetchDetail();
  };

  const handleLeaveHome = async (): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.leaveHome(homeId);
    await fetchDetail();
  };

  const handleDeleteHome = async (): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.deleteHome(homeId);
  };

  const handleArchiveHome = async (): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.archiveHome(homeId);
    await fetchDetail();
  };

  const handleUnarchiveHome = async (): Promise<void> => {
    if (!homeId) throw new Error('Hogar no especificado');
    await homeService.unarchiveHome(homeId);
    await fetchDetail();
  };

  return {
    home,
    isLoading,
    error,
    isAdmin,
    isActiveMember,
    isLeftMember,
    isArchivedMember,
    activeMembers,
    leftMembers,
    activeAdminsCount,
    isSoleActiveMember,
    isOnlyAdminWithOtherMembers,
    canLeaveWithoutTransfer,
    refetch: fetchDetail,
    regenerateInvitationCode: handleRegenerateCode,
    transferAdmin: handleTransferAdmin,
    expelMember: handleExpelMember,
    forceExpelMember: handleForceExpelMember,
    leaveHome: handleLeaveHome,
    deleteHome: handleDeleteHome,
    archiveHome: handleArchiveHome,
    unarchiveHome: handleUnarchiveHome,
  };
}
