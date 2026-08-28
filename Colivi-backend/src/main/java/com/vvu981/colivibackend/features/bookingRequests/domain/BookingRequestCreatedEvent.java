package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.time.LocalDate;

public record BookingRequestCreatedEvent(
    String hostEmail,
    String tenantName,
    String listingTitle,
    LocalDate startDate,
    LocalDate endDate,
    String message
) {}
