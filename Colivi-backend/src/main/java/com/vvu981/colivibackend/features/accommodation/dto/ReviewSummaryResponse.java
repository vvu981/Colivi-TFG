package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.Map;

public record ReviewSummaryResponse(
        Double averageRating,
        Long totalReviews,
        Map<Integer, Long> ratingBreakdown
) {}
