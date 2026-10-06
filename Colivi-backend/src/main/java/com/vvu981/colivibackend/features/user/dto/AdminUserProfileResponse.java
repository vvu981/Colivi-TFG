package com.vvu981.colivibackend.features.user.dto;

import com.vvu981.colivibackend.features.user.domain.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserProfileResponse(
        UUID id,
        String email,
        String phone,
        UserRole role,
        String nickname,
        String firstName,
        String lastName1,
        String lastName2,
        String profilePicUrl,
        LocalDateTime createdAt,
        LocalDateTime deletedAt,
        LocalDateTime bannedAt,
        LocalDateTime bannedUntil,
        String banReason
) {
}
