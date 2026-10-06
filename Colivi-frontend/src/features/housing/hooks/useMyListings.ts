import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { listingService } from '../api/listingService';
import type { AccommodationListingResponse } from '../types/listing.types';
import type { Page } from '../types/accommodation.types';
import { useAuth } from '../../auth/context/AuthContext';

interface UseMyListingsResult {
  listings: AccommodationListingResponse[];
  totalElements: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMyListings = (page = 0, size = 10, accommodationId?: string): UseMyListingsResult => {
  const { user } = useAuth();
  const [data, setData] = useState<Page<AccommodationListingResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!user?.id) return;
    
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const searchParams = {
      hostId: user.id,
      page,
      size,
      ...(accommodationId ? { accommodationId } : {}),
    };

    listingService
      .search(searchParams)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAxiosError(err)) {
            setError(
              err.response?.data?.message ?? 'Error al cargar tus anuncios.',
            );
          } else {
            setError('Error inesperado al cargar tus anuncios.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, page, size, tick, accommodationId]);

  return {
    listings: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    isLoading,
    error,
    refetch,
  };
};
