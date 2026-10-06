package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;
import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseParticipantResponseDto(
        UUID id,
        UserProfileResponse user,
        BigDecimal owedAmount
) {}
