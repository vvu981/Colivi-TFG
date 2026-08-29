package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.time.LocalDate;
import java.util.UUID;

public record BookingRequestCreatedEvent(
    UUID requestId,
    String hostEmail,
    String tenantName,
    String tenantEmail,
    String listingTitle,
    LocalDate startDate,
    LocalDate endDate,
    String message
) {}
