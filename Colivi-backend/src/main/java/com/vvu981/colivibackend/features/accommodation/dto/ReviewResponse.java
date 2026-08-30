package com.vvu981.colivibackend.features.accommodation.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID listingId,
        UUID bookingRequestId,
        UUID authorId,
        String authorNickname,
        String authorProfilePicUrl,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
