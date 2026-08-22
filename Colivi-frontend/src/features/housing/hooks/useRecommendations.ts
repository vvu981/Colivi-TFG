import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { getRecentSearch, type RecentSearch } from '../../../utils/recentSearch';
import {
  fetchRecommendations,
  type RecommendationsParams,
} from '../api/recommendationsService';
import type { AccommodationListingResponse } from '../../../types/listing';

interface UseRecommendationsResult {
  data: AccommodationListingResponse[];
  isLoading: boolean;
  error: string | null;
  /** Call this to force a re-fetch (e.g. after saving a new search). */
  refresh: () => void;
}

/**
 * Custom hook that retrieves listing recommendations.
 *
 * - SRP: only manages fetch state (data / isLoading / error).
 * - If the user is NOT authenticated, it reads the last anonymous search
 *   from localStorage and passes it as query params.
 * - If the user IS authenticated, the bearer token added by the axios
 *   interceptor is enough; no params are needed.
 * - Exposes a `refresh` callback so consumers (e.g. SearchBar) can trigger
 *   a re-fetch without unmounting/remounting.
 */
export const useRecommendations = (): UseRecommendationsResult => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<AccommodationListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incrementing this counter triggers a new fetch
  const [fetchTick, setFetchTick] = useState(0);

  const refresh = useCallback(() => {
    setFetchTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Wait until the auth context has resolved before fetching
    if (isAuthLoading) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const recentSearch: RecentSearch | null = isAuthenticated
          ? null
          : getRecentSearch();

        const params: RecommendationsParams | undefined =
          recentSearch ?? undefined;

        const result = await fetchRecommendations(params);

        if (!cancelled) setData(result);
      } catch {
        if (!cancelled)
          setError(
            'No se pudieron cargar las recomendaciones. Inténtalo de nuevo más tarde.',
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // fetchTick is the manual refresh trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading, fetchTick]);

  return { data, isLoading, error, refresh };
};
