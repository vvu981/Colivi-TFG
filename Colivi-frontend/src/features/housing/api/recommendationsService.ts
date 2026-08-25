import api from '../../../lib/api';
import type { AccommodationListingResponse } from '../types/listing.types';

export interface RecommendationsParams {
  city?: string;
  maxPrice?: number;
  accommodationType?: string;
}

/**
 * Fetches listing recommendations from the API.
 * Uses the shared `api` client (baseURL: /api/v1) consistent with the rest of
 * the project so that Vite's proxy forwards the request to the backend.
 *
 * When params are provided they are forwarded as query string (anonymous users).
 * Authenticated requests rely on the Authorization header added by api's interceptor.
 */
export const fetchRecommendations = async (
  params?: RecommendationsParams,
): Promise<AccommodationListingResponse[]> => {
  const response = await api.get<AccommodationListingResponse[]>(
    '/listings/recommendations',
    { params },
  );
  return response.data;
};
