package com.vvu981.colivibackend.features.user.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn
) {}