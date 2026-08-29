import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import {
  fetchRecommendations,
  type RecommendationsParams,
} from '../api/recommendationsService';
import type { RecommendationResponse } from '../types/listing.types';

export interface UseRecommendationsResult {
  data: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Executes an active search for the current session. */
  search: (params?: RecommendationsParams) => void;
  /** Resets the active search and re-fetches clean recommendations. */
  reset: () => void;
  /** Refreshes using current search params. */
  refresh: () => void;
}

/**
 * Custom hook that retrieves listing recommendations.
 *
 * - SRP: manages recommendation fetch state.
 * - Initial load is completely clean (no stale localStorage filters injected).
 * - Active searches in the current session are explicitly triggered via `search(params)`.
 * - Calling `reset()` clears the active search and restores default recommendations.
 */
export const useRecommendations = (): UseRecommendationsResult => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeParams, setActiveParams] = useState<RecommendationsParams | undefined>(undefined);
  const [fetchTick, setFetchTick] = useState(0);

  const search = useCallback((params?: RecommendationsParams) => {
    setActiveParams(params);
    setFetchTick((prev) => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setActiveParams(undefined);
    setFetchTick((prev) => prev + 1);
  }, []);

  const refresh = useCallback(() => {
    setFetchTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchRecommendations(activeParams);

        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) {
          setError(
            'No se pudieron cargar las recomendaciones. Inténtalo de nuevo más tarde.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthLoading, fetchTick, activeParams]);

  return { data, isLoading, error, search, reset, refresh };
};

