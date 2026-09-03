package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ExpenseResponseDto(
        UUID id,
        UUID homeId,
        String description,
        BigDecimal totalAmount,
        UserProfileResponse payer,
        LocalDateTime createdAt,
        boolean isPayment,
        List<ExpenseParticipantResponseDto> participants
) {
    public ExpenseResponseDto(
            UUID id,
            UUID homeId,
            String description,
            BigDecimal totalAmount,
            UserProfileResponse payer,
            LocalDateTime createdAt,
            List<ExpenseParticipantResponseDto> participants
    ) {
        this(id, homeId, description, totalAmount, payer, createdAt, false, participants);
    }
}
