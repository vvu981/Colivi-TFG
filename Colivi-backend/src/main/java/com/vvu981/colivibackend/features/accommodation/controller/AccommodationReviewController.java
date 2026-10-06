package com.vvu981.colivibackend.features.accommodation.controller;

import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.accommodation.dto.CreateReviewRequest;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewEligibilityResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewResponse;
import com.vvu981.colivibackend.features.accommodation.dto.ReviewSummaryResponse;
import com.vvu981.colivibackend.features.accommodation.service.AccommodationReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AccommodationReviewController {

    private final AccommodationReviewService reviewService;

    @PostMapping("/api/v1/listings/{listingId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable UUID listingId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        ReviewResponse response = reviewService.createReview(listingId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/v1/listings/{listingId}/reviews")
    public ResponseEntity<Page<ReviewResponse>> getListingReviews(
            @PathVariable UUID listingId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReviewResponse> reviews = reviewService.getListingReviews(listingId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/api/v1/listings/{listingId}/reviews/summary")
    public ResponseEntity<ReviewSummaryResponse> getListingReviewSummary(@PathVariable UUID listingId) {
        ReviewSummaryResponse summary = reviewService.getListingReviewSummary(listingId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/v1/listings/{listingId}/reviews/eligibility")
    public ResponseEntity<ReviewEligibilityResponse> checkEligibility(
            @PathVariable UUID listingId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        ReviewEligibilityResponse eligibility = reviewService.checkEligibility(listingId, currentUserId);
        return ResponseEntity.ok(eligibility);
    }

    @GetMapping("/api/v1/accommodations/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviewsByCity(@RequestParam String city) {
        List<ReviewResponse> reviews = reviewService.getReviewsByCity(city);
        return ResponseEntity.ok(reviews);
    }

    @DeleteMapping("/api/v1/reviews/{reviewId}")
    public ResponseEntity<Void> deleteMyReview(
            @PathVariable UUID reviewId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        reviewService.deleteReview(reviewId, currentUserId, false);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/api/v1/admin/reviews/{reviewId}")
    public ResponseEntity<Void> adminDeleteReview(
            @PathVariable UUID reviewId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        reviewService.deleteReview(reviewId, currentUserId, true);
        return ResponseEntity.noContent().build();
    }
}
