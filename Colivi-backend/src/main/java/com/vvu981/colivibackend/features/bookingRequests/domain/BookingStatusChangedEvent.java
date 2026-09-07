package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record BookingStatusChangedEvent(
    UUID bookingRequestId,
    String tenantEmail,
    String listingTitle,
    RequestStatus status,
    boolean isAccepted,
    LocalDateTime expiresAt,
    boolean hasDeposit
) {
    // Constructor de retrocompatibilidad para emisores existentes y tests
    public BookingStatusChangedEvent(
            String tenantEmail,
            String listingTitle,
            RequestStatus status,
            boolean isAccepted,
            LocalDateTime expiresAt
    ) {
        this(null, tenantEmail, listingTitle, status, isAccepted, expiresAt, false);
    }
}
