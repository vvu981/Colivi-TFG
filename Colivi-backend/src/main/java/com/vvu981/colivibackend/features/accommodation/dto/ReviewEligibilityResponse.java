package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.UUID;

public record ReviewEligibilityResponse(
        boolean eligible,
        UUID eligibleBookingRequestId,
        boolean alreadyReviewed,
        String reason
) {}
