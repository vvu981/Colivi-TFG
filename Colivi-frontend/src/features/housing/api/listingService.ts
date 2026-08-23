import api from '../../../lib/api';
import type {
  AccommodationListingRequest,
  AccommodationListingResponse,
  AccommodationListingUpdateRequest,
  ListingFilterParams,
} from '../types/listing.types';
import type { Page } from '../types/accommodation.types';

// ── Listing Service ───────────────────────────────────────────────

export const listingService = {
  /**
   * POST /api/v1/listings
   * Creates a new listing (anuncio) linked to an existing accommodation.
   * Requires an existing accommodationId.
   */
  create: async (
    data: AccommodationListingRequest,
  ): Promise<AccommodationListingResponse> => {
    const response = await api.post<AccommodationListingResponse>('/listings', data);
    return response.data;
  },

  /**
   * GET /api/v1/listings
   * Public catalog with optional filters (city, maxPrice, rentalType, etc.).
   */
  search: async (
    params: ListingFilterParams = {},
  ): Promise<Page<AccommodationListingResponse>> => {
    const response = await api.get<Page<AccommodationListingResponse>>('/listings', {
      params,
    });
    return response.data;
  },

  /**
   * GET /api/v1/listings/:id
   * Returns a single listing by ID.
   */
  getById: async (id: string): Promise<AccommodationListingResponse> => {
    const response = await api.get<AccommodationListingResponse>(`/listings/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/listings/accommodation/:id
   * Returns all active listings for a specific accommodation.
   */
  getByAccommodationId: async (accommodationId: string): Promise<AccommodationListingResponse[]> => {
    const response = await api.get<AccommodationListingResponse[]>(`/listings/accommodation/${accommodationId}`);
    return response.data;
  },

  /**
   * PUT /api/v1/listings/:id
   * Updates title, description and/or pricePerMonth of an existing listing.
   */
  update: async (
    id: string,
    data: AccommodationListingUpdateRequest,
  ): Promise<AccommodationListingResponse> => {
    const response = await api.put<AccommodationListingResponse>(`/listings/${id}`, data);
    return response.data;
  },

  /**
   * PATCH /api/v1/listings/softDelete/:id
   * Soft-deletes a listing (owner only).
   */
  softDelete: async (id: string): Promise<void> => {
    await api.patch(`/listings/softDelete/${id}`);
  },

  /**
   * PATCH /api/v1/listings/recover/:id
   * Recovers a soft-deleted listing (owner only).
   */
  recover: async (id: string): Promise<AccommodationListingResponse> => {
    const response = await api.patch<AccommodationListingResponse>(
      `/listings/recover/${id}`,
    );
    return response.data;
  },
};
