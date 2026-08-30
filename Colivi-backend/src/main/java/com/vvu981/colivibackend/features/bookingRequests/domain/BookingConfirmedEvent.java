package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.time.LocalDate;
import java.util.UUID;

public record BookingConfirmedEvent(
        UUID accommodationListingId,
        UUID confirmedRequestId,
        LocalDate startDate,
        LocalDate endDate,
        String tenantEmail,
        String landlordEmail,
        String listingTitle
) {
}
