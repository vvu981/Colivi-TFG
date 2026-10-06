import { useState, useEffect, useCallback } from 'react';
import { homeService } from '../api/homeService';
import type { ActivityLogResponseDto, Page } from '../types';

export interface UseHomeActivitiesReturn {
  activities: ActivityLogResponseDto[];
  pageData: Page<ActivityLogResponseDto> | null;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useHomeActivities(
  homeId: string | undefined,
  initialPage: number = 0,
  pageSize: number = 20
): UseHomeActivitiesReturn {
  const [pageData, setPageData] = useState<Page<ActivityLogResponseDto> | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!homeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await homeService.getHomeActivities(homeId, currentPage, pageSize);
      setPageData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar las actividades del hogar';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [homeId, currentPage, pageSize]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities: pageData?.content ?? [],
    pageData,
    currentPage,
    isLoading,
    error,
    setPage: setCurrentPage,
    refetch: fetchActivities,
  };
}
