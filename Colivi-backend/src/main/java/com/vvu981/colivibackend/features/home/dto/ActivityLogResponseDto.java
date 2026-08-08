package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.home.domain.ActivityType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ActivityLogResponseDto(
        UUID id,
        UUID homeId,
        UUID actorId,
        String actorFullName,
        ActivityType activityType,
        String description,
        String metadata,
        LocalDateTime createdAt
) {
}
