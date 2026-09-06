package com.vvu981.colivibackend.features.home.chore.dto;

import java.util.UUID;

public record UserChoreScoreDto(
        UUID userId,
        String nickname,
        String fullName,
        String profilePicUrl,
        int currentPoints,
        int expectedPoints,
        int completedCount,
        int rescuedCount,
        int penalizedCount,
        int pendingCount
) {}
