import { useState } from 'react';
import { isAxiosError } from 'axios';
import { accommodationService } from '../api/accommodationService';

export interface UseDeleteAccommodationResult {
  deleteAccommodation: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Hook for soft-deleting an accommodation.
 * Single Responsibility: Orchestrate deletion state and API communication.
 */
export const useDeleteAccommodation = (): UseDeleteAccommodationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccommodation = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await accommodationService.softDelete(id);
      return true;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al eliminar el alojamiento.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al eliminar el alojamiento.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteAccommodation, isLoading, error, setError };
};
