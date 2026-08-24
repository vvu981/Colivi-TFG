import { useState } from 'react';
import { isAxiosError } from 'axios';
import { accommodationService } from '../api/accommodationService';
import type { AccommodationRequest, AccommodationResponse } from '../types/accommodation.types';

interface UseCreateAccommodationResult {
  isLoading: boolean;
  error: string | null;
  created: AccommodationResponse | null;
  createAccommodation: (data: AccommodationRequest) => Promise<AccommodationResponse | null>;
  reset: () => void;
}

export const useCreateAccommodation = (): UseCreateAccommodationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AccommodationResponse | null>(null);

  const reset = () => {
    setError(null);
    setCreated(null);
  };

  const createAccommodation = async (
    data: AccommodationRequest,
  ): Promise<AccommodationResponse | null> => {
    reset();
    setIsLoading(true);

    try {
      const result = await accommodationService.create(data);
      setCreated(result);
      return result;
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            'No se pudo crear el alojamiento. Verifica los datos e inténtalo de nuevo.',
        );
      } else {
        setError('Ocurrió un error inesperado al crear el alojamiento.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, created, createAccommodation, reset };
};
