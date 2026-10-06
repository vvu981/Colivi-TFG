import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { accommodationService } from '../api/accommodationService';
import type { AccommodationResponse } from '../types/accommodation.types';

interface UseGetAccommodationResult {
  accommodation: AccommodationResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGetAccommodation = (id?: string): UseGetAccommodationResult => {
  const [accommodation, setAccommodation] = useState<AccommodationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!id) return;
    
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    accommodationService
      .getById(id)
      .then((data) => {
        if (!cancelled) setAccommodation(data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAxiosError(err)) {
            setError(err.response?.data?.message ?? 'Error al cargar el alojamiento.');
          } else {
            setError('Error inesperado al cargar el alojamiento.');
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

  return { accommodation, isLoading, error, refetch };
};
