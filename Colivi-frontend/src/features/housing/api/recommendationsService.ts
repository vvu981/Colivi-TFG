import api from '../../../lib/api';
import type { RecommendationResponse } from '../types/listing.types';

export interface RecommendationsParams {
  title?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  rentalType?: string;
  amenities?: string;
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
): Promise<RecommendationResponse> => {
  const response = await api.get<RecommendationResponse>(
    '/listings/recommendations',
    { params },
  );
  return response.data;
};
