package com.vvu981.colivibackend.features.bookingRequests.domain;

public record BookingStatusChangedEvent(
    String tenantEmail,
    String listingTitle,
    RequestStatus status,
    boolean isAccepted
) {}
