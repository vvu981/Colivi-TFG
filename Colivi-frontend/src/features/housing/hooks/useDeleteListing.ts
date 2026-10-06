import { useState } from 'react';
import { isAxiosError } from 'axios';
import { listingService } from '../api/listingService';

export interface UseDeleteListingResult {
  deleteListing: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Hook for soft-deleting an accommodation listing.
 * Single Responsibility: Orchestrate deletion state and API communication.
 */
export const useDeleteListing = (): UseDeleteListingResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteListing = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await listingService.softDelete(id);
      return true;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al eliminar el anuncio.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al eliminar el anuncio.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteListing, isLoading, error, setError };
};
