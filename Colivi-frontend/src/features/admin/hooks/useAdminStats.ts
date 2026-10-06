import { useState, useEffect, useCallback } from 'react';
import { adminReportService } from '../services/adminReportService';
import type { ReportTargetCount } from '../types/admin.types';

export const useAdminStats = () => {
  const [mostReportedListings, setMostReportedListings] = useState<ReportTargetCount[]>([]);
  const [mostReportedUsers, setMostReportedUsers] = useState<ReportTargetCount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listingsRes, usersRes] = await Promise.all([
        adminReportService.getMostReportedTargets('LISTING', 0, 10),
        adminReportService.getMostReportedTargets('USER', 0, 10),
      ]);
      setMostReportedListings(listingsRes.content || []);
      setMostReportedUsers(usersRes.content || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estadísticas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    mostReportedListings,
    mostReportedUsers,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
