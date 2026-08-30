import { useState, useEffect, useCallback } from 'react';
import { userService, type PublicUserProfile } from '../services/userService';
import { listingService } from '../../housing/api/listingService';
import type { AccommodationListingResponse } from '../../housing/types/listing.types';
import { useAuth } from '../../auth/context/AuthContext';

export interface UsePublicProfileResult {
  user: PublicUserProfile | null;
  listings: AccommodationListingResponse[];
  isLoading: boolean;
  error: string | null;
  isSelf: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch public user profile data and their published accommodations.
 * Single Responsibility: Data lifecycle and state management for public profile view.
 */
export const usePublicProfile = (userId?: string): UsePublicProfileResult => {
  const { user: currentAuthUser } = useAuth();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [listings, setListings] = useState<AccommodationListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isSelf = Boolean(
    currentAuthUser?.id && userId && currentAuthUser.id === userId
  );

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      setError('ID de usuario no especificado.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user public data
      const userData = await userService.getById(userId);
      setUser(userData);

      // Fetch user published listings concurrently
      try {
        const listingsPage = await listingService.search({ hostId: userId, size: 20 });
        setListings(listingsPage.content || []);
      } catch (listingsErr) {
        // Listings failing should not crash the user profile
        console.warn('Could not load user listings', listingsErr);
        setListings([]);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? 'El usuario solicitado no existe o no está disponible.'
          : 'No se pudo cargar el perfil del usuario.');
      setError(msg);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return {
    user,
    listings,
    isLoading,
    error,
    isSelf,
    refetch: fetchProfileData,
  };
};
