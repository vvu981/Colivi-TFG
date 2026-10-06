import { useState } from 'react';
import { isAxiosError } from 'axios';
import { accommodationService } from '../api/accommodationService';
import type { AccommodationRequest, AccommodationResponse } from '../types/accommodation.types';

export const useUpdateAccommodation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAccommodation = async (id: string, data: AccommodationRequest): Promise<AccommodationResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await accommodationService.update(id, data);
      return response;
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al actualizar el alojamiento.');
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateAccommodation, isLoading, error, setError };
};
