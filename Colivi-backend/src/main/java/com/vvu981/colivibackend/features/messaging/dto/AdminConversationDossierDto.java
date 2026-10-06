package com.vvu981.colivibackend.features.messaging.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminConversationDossierDto(
        UUID conversationId,
        AdminListingSnippetDto listing,
        AdminUserSnippetDto tenant,
        AdminUserSnippetDto host,
        AdminBookingSnippetDto activeBooking,
        List<MessageResponseDto> messages,
        LocalDateTime createdAt,
        LocalDateTime lastMessageAt,
        boolean isReported
) {
    public record AdminListingSnippetDto(
            UUID id,
            String title,
            String thumbnailUrl,
            BigDecimal pricePerMonth,
            String city,
            String rentalType,
            String status
    ) {}

    public record AdminUserSnippetDto(
            UUID id,
            String nickname,
            String firstName,
            String lastName,
            String email,
            String profilePicUrl,
            String role,
            boolean isBanned,
            LocalDateTime bannedUntil,
            String banReason
    ) {}

    public record AdminBookingSnippetDto(
            UUID id,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            String transactionId
    ) {}
}
