package com.vvu981.colivibackend.features.home.dto;

import com.vvu981.colivibackend.features.user.dto.UserProfileResponse;

import java.math.BigDecimal;

public record BalanceResponseDto(
        UserProfileResponse user,
        BigDecimal amount
) {}
