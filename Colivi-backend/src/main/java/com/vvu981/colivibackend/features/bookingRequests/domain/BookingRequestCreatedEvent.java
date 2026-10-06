package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.time.LocalDate;
import java.util.UUID;

public record BookingRequestCreatedEvent(
    UUID requestId,
    UUID requesterId,
    UUID listingId,
    UUID hostId,
    String hostEmail,
    String tenantName,
    String tenantEmail,
    String listingTitle,
    LocalDate startDate,
    LocalDate endDate,
    String message
) {
    public BookingRequestCreatedEvent(
        UUID requestId,
        String hostEmail,
        String tenantName,
        String tenantEmail,
        String listingTitle,
        LocalDate startDate,
        LocalDate endDate,
        String message
    ) {
        this(requestId, null, null, null, hostEmail, tenantName, tenantEmail, listingTitle, startDate, endDate, message);
    }
}
