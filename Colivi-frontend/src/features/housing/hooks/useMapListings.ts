import { useCallback, useEffect, useState } from 'react';
import { listingService } from '../api/listingService';
import type { AccommodationListingResponse, ListingFilterParams } from '../types/listing.types';

// ── Types ─────────────────────────────────────────────────────────────

export interface UseMapListingsResult {
  listings: AccommodationListingResponse[];
  isLoading: boolean;
  error: string | null;
  /** Triggers a new fetch with the given filter params. */
  search: (params: ListingFilterParams) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────

/**
 * Fetches a large, unpaginated-ish slice of listings for map rendering.
 *
 * - SRP: owns only the fetch lifecycle for map listings.
 * - Uses `listingService.search` with a large `size` so that the map shows
 *   as many pins as possible without manual pagination.
 * - Exposes a `search` callback so the map page can re-fetch with new filters.
 */
export const useMapListings = (): UseMapListingsResult => {
  const [listings, setListings] = useState<AccommodationListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListingFilterParams>({ size: 200, page: 0 });

  const search = useCallback((newParams: ListingFilterParams) => {
    setParams({ size: 200, page: 0, ...newParams });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const page = await listingService.search(params);
        if (!cancelled) setListings(page.content);
      } catch {
        if (!cancelled)
          setError('No se pudieron cargar los anuncios. Inténtalo de nuevo más tarde.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return { listings, isLoading, error, search };
};
