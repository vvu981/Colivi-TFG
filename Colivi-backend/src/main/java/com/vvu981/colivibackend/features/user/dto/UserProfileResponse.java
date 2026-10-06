package com.vvu981.colivibackend.features.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String nickname,
        String firstName,
        String lastName1,
        String lastName2,
        String profilePicUrl,
        LocalDateTime createdAt
) {
}
