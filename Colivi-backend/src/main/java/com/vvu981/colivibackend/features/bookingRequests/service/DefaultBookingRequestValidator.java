package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@Component
@RequiredArgsConstructor
public class DefaultBookingRequestValidator implements BookingRequestValidator {

    private final BookingRequestRepository bookingRequestRepository;

    @Override
    public void validateBookingDates(LocalDate startDate, LocalDate endDate, AccommodationListing listing) {
        if (startDate == null || endDate == null) {
            throw new BusinessRuleValidationException("Las fechas de inicio y fin son obligatorias.");
        }

        if (startDate.isBefore(LocalDate.now().withDayOfMonth(1))) {
            throw new BusinessRuleValidationException("La fecha de inicio no puede ser una fecha pasada.");
        }

        if (startDate.getDayOfMonth() != 1) {
            throw new BusinessRuleValidationException("La reserva debe comenzar el día 1 del mes.");
        }

        if (!endDate.equals(endDate.with(TemporalAdjusters.lastDayOfMonth()))) {
            throw new BusinessRuleValidationException("La reserva debe terminar el último día del mes.");
        }

        if (startDate.isAfter(endDate)) {
            throw new BusinessRuleValidationException("La fecha de inicio debe ser anterior a la de fin.");
        }

        long activeBookings = bookingRequestRepository.countOverlappingAcceptedBookings(listing.getId(), startDate, endDate);
        if (activeBookings > 0) {
            throw new BusinessRuleValidationException("El alojamiento ya está completo para las fechas seleccionadas.");
        }
    }
}
