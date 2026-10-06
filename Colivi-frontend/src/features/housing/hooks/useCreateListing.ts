import { useState } from 'react';
import { isAxiosError } from 'axios';
import { listingService } from '../api/listingService';
import type {
  AccommodationListingRequest,
  AccommodationListingResponse,
} from '../types/listing.types';

interface UseCreateListingResult {
  isLoading: boolean;
  error: string | null;
  created: AccommodationListingResponse | null;
  createListing: (
    data: AccommodationListingRequest,
  ) => Promise<AccommodationListingResponse | null>;
  reset: () => void;
}

export const useCreateListing = (): UseCreateListingResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AccommodationListingResponse | null>(null);

  const reset = () => {
    setError(null);
    setCreated(null);
  };

  const createListing = async (
    data: AccommodationListingRequest,
  ): Promise<AccommodationListingResponse | null> => {
    reset();
    setIsLoading(true);

    try {
      const result = await listingService.create(data);
      setCreated(result);
      return result;
    } catch (err) {
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            'No se pudo publicar el anuncio. Verifica los datos e inténtalo de nuevo.',
        );
      } else {
        setError('Ocurrió un error inesperado al publicar el anuncio.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, created, createListing, reset };
};
