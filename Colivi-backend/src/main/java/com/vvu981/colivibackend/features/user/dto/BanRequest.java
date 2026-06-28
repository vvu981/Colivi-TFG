package com.vvu981.colivibackend.features.user.dto;

import java.time.LocalDateTime;

public record BanRequest(
        String message,
        LocalDateTime bannedUntil
) {
}
