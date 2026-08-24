import { useState, useEffect } from 'react';
import { listingService } from '../api/listingService';
import type { AccommodationListingResponse } from '../types/listing.types';

export const useListingsByAccommodation = (accommodationId?: string) => {
  const [listings, setListings] = useState<AccommodationListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accommodationId) {
      setListings([]);
      return;
    }

    let isMounted = true;

    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listingService.getByAccommodationId(accommodationId);
        if (isMounted) {
          setListings(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            'Error al cargar los anuncios de este alojamiento.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchListings();

    return () => {
      isMounted = false;
    };
  }, [accommodationId]);

  return { listings, isLoading, error };
};
