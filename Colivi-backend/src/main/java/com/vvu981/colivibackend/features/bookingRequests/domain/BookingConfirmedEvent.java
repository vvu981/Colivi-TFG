package com.vvu981.colivibackend.features.bookingRequests.domain;

import java.util.UUID;

public record BookingConfirmedEvent(
        UUID accommodationListingId,
        UUID confirmedRequestId
) {
}
