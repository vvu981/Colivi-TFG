import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { accommodationService } from '../api/accommodationService';
import type { AccommodationResponse, Page } from '../types/accommodation.types';

interface UseMyAccommodationsResult {
  accommodations: AccommodationResponse[];
  totalElements: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMyAccommodations = (
  page = 0,
  size = 10,
): UseMyAccommodationsResult => {
  const [data, setData] = useState<Page<AccommodationResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    accommodationService
      .getMyAccommodations('AVAILABLE', page, size)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAxiosError(err)) {
            setError(
              err.response?.data?.message ?? 'Error al cargar tus alojamientos.',
            );
          } else {
            setError('Error inesperado al cargar tus alojamientos.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, size, tick]);

  return {
    accommodations: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    isLoading,
    error,
    refetch,
  };
};
