import { useState } from 'react';
import { isAxiosError } from 'axios';
import { listingService } from '../api/listingService';
import type { AccommodationListingUpdateRequest, AccommodationListingResponse } from '../types/listing.types';

export const useUpdateListing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateListing = async (id: string, data: AccommodationListingUpdateRequest): Promise<AccommodationListingResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listingService.update(id, data);
      return response;
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al actualizar el anuncio.');
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateListing, isLoading, error, setError };
};
