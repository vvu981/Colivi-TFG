package com.vvu981.colivibackend.features.home.chore.dto;

import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ChoreResponseDto(
        UUID id,
        UUID seriesId,
        UUID homeId,
        String title,
        String description,
        UUID assigneeId,
        String assigneeName,
        String assigneeAvatar,
        String assigneeColor,
        UUID completedById,
        String completedByName,
        String completedByAvatar,
        Integer basePoints,
        LocalDate dueDate,
        ChoreStatus status,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        boolean isLate,
        boolean canRescue,
        boolean canComplete
) {}
