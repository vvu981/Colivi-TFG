import api from '../../../lib/api';
import type {
  CreateReviewRequest,
  ReviewResponse,
  ReviewSummaryResponse,
  ReviewEligibilityResponse,
  PaginatedReviews,
} from '../types/review.types';

export const accommodationReviewService = {
  /**
   * GET /api/v1/listings/:id/reviews
   * Retrieves paginated reviews for a listing.
   */
  getListingReviews: async (
    listingId: string,
    page = 0,
    size = 10,
  ): Promise<PaginatedReviews> => {
    const response = await api.get<PaginatedReviews>(
      `/listings/${listingId}/reviews`,
      { params: { page, size } },
    );
    return response.data;
  },

  /**
   * GET /api/v1/listings/:id/reviews/summary
   * Returns average rating, total count and rating breakdown.
   */
  getListingReviewSummary: async (
    listingId: string,
  ): Promise<ReviewSummaryResponse> => {
    const response = await api.get<ReviewSummaryResponse>(
      `/listings/${listingId}/reviews/summary`,
    );
    return response.data;
  },

  /**
   * GET /api/v1/listings/:id/reviews/eligibility
   * Checks if current authenticated user has a CONFIRMED booking and hasn't reviewed yet.
   */
  checkEligibility: async (
    listingId: string,
  ): Promise<ReviewEligibilityResponse> => {
    const response = await api.get<ReviewEligibilityResponse>(
      `/listings/${listingId}/reviews/eligibility`,
    );
    return response.data;
  },

  /**
   * POST /api/v1/listings/:id/reviews
   * Submits a verified stay review.
   */
  createReview: async (
    listingId: string,
    payload: CreateReviewRequest,
  ): Promise<ReviewResponse> => {
    const response = await api.post<ReviewResponse>(
      `/listings/${listingId}/reviews`,
      payload,
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/reviews/:id
   * Removes author's own review.
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },
};
