package com.vvu981.colivibackend.features.accommodation.service;

import com.vvu981.colivibackend.features.accommodation.dto.CreateReviewRequest;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewEligibilityResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AccommodationReviewService {

    ReviewResponse createReview(UUID listingId, CreateReviewRequest request, UUID currentUserId);

    Page<ReviewResponse> getListingReviews(UUID listingId, Pageable pageable);

    ReviewSummaryResponse getListingReviewSummary(UUID listingId);

    ReviewEligibilityResponse checkEligibility(UUID listingId, UUID currentUserId);

    List<ReviewResponse> getReviewsByCity(String city);

    void deleteReview(UUID reviewId, UUID currentUserId, boolean isAdmin);
}
