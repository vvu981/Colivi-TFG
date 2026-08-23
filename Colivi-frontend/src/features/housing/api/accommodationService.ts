import api from '../../../lib/api';
import type {
  AccommodationRequest,
  AccommodationResponse,
  AccommodationVisibility,
  Page,
} from '../types/accommodation.types';

// ── Accommodation Service ─────────────────────────────────────────

export const accommodationService = {
  /**
   * POST /api/v1/accommodation
   * Creates a new physical accommodation owned by the authenticated user.
   */
  create: async (data: AccommodationRequest): Promise<AccommodationResponse> => {
    const response = await api.post<AccommodationResponse>('/accommodation', data);
    return response.data;
  },

  /**
   * GET /api/v1/accommodation/me
   * Returns paginated list of accommodations owned by the authenticated user.
   */
  getMyAccommodations: async (
    visibility: AccommodationVisibility = 'AVAILABLE',
    page = 0,
    size = 10,
  ): Promise<Page<AccommodationResponse>> => {
    const response = await api.get<Page<AccommodationResponse>>('/accommodation/me', {
      params: { visibility, page, size },
    });
    return response.data;
  },

  /**
   * GET /api/v1/accommodation/:id
   * Returns a single accommodation by ID.
   */
  getById: async (id: string): Promise<AccommodationResponse> => {
    const response = await api.get<AccommodationResponse>(`/accommodation/${id}`);
    return response.data;
  },

  /**
   * PUT /api/v1/accommodation/:id
   * Updates an existing accommodation.
   */
  update: async (id: string, data: AccommodationRequest): Promise<AccommodationResponse> => {
    const response = await api.put<AccommodationResponse>(`/accommodation/${id}`, data);
    return response.data;
  },

  /**
   * POST /api/v1/accommodation/:id/images
   * Uploads a single image for an accommodation (multipart/form-data).
   */
  uploadImage: async (id: string, file: File): Promise<AccommodationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<AccommodationResponse>(
      `/accommodation/${id}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/accommodation/:id/images/:imageId
   * Removes a specific image from an accommodation.
   */
  deleteImage: async (id: string, imageId: string): Promise<void> => {
    await api.delete(`/accommodation/${id}/images/${imageId}`);
  },

  /**
   * PATCH /api/v1/accommodation/delete/:id
   * Soft-deletes an accommodation (owner only).
   */
  softDelete: async (id: string): Promise<AccommodationResponse> => {
    const response = await api.patch<AccommodationResponse>(`/accommodation/delete/${id}`);
    return response.data;
  },
};
