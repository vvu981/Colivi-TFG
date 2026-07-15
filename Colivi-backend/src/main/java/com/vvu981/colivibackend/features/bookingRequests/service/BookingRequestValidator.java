package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;

import java.time.LocalDate;

public interface BookingRequestValidator {
    void validateBookingDates(LocalDate startDate, LocalDate endDate, AccommodationListing listing);
}
