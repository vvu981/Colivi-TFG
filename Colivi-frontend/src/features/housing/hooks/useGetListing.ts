import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { listingService } from '../api/listingService';
import type { AccommodationListingResponse } from '../types/listing.types';

interface UseGetListingResult {
  listing: AccommodationListingResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGetListing = (id?: string): UseGetListingResult => {
  const [listing, setListing] = useState<AccommodationListingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!id) return;
    
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listingService
      .getById(id)
      .then((data) => {
        if (!cancelled) setListing(data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAxiosError(err)) {
            setError(err.response?.data?.message ?? 'Error al cargar el anuncio.');
          } else {
            setError('Error inesperado al cargar el anuncio.');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  return { listing, isLoading, error, refetch };
};
