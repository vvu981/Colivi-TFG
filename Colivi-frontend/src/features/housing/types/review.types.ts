export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  listingId: string;
  bookingRequestId: string;
  authorId: string;
  authorNickname: string;
  authorProfilePicUrl?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ReviewSummaryResponse {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

export interface ReviewEligibilityResponse {
  eligible: boolean;
  eligibleBookingRequestId?: string | null;
  alreadyReviewed?: boolean;
  reason?: string | null;
}

export interface PaginatedReviews {
  content: ReviewResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
