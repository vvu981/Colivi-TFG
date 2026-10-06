package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingRequestValidatorTest {

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @InjectMocks
    private DefaultBookingRequestValidator validator;

    private AccommodationListing listing;
    private Accommodation accommodation;

    @BeforeEach
    void setUp() {
        listing = mock(AccommodationListing.class);
        accommodation = mock(Accommodation.class);
    }

    @Test
    @DisplayName("Lanza excepción si startDate o endDate son nulos")
    void shouldThrowWhenDatesAreNull() {
        assertThatThrownBy(() -> validator.validateBookingDates(null, LocalDate.now(), listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("Las fechas de inicio y fin son obligatorias.");

        assertThatThrownBy(() -> validator.validateBookingDates(LocalDate.now(), null, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("Las fechas de inicio y fin son obligatorias.");
    }

    @Test
    @DisplayName("Lanza excepción si startDate es en el pasado (meses anteriores al actual)")
    void shouldThrowWhenStartDateInPast() {
        LocalDate pastDate = LocalDate.now().minusMonths(1).withDayOfMonth(1);
        LocalDate endDate = pastDate.withDayOfMonth(pastDate.lengthOfMonth());

        assertThatThrownBy(() -> validator.validateBookingDates(pastDate, endDate, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("La fecha de inicio no puede ser una fecha pasada.");
    }

    @Test
    @DisplayName("Lanza excepción si startDate no es el día 1")
    void shouldThrowWhenStartDateNotFirstDay() {
        LocalDate startDate = LocalDate.now().plusMonths(1).withDayOfMonth(2);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        assertThatThrownBy(() -> validator.validateBookingDates(startDate, endDate, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("La reserva debe comenzar el día 1 del mes.");
    }

    @Test
    @DisplayName("Lanza excepción si endDate no es el último día")
    void shouldThrowWhenEndDateNotLastDay() {
        LocalDate startDate = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        LocalDate endDate = startDate.plusDays(10); // Not last day

        assertThatThrownBy(() -> validator.validateBookingDates(startDate, endDate, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("La reserva debe terminar el último día del mes.");
    }

    @Test
    @DisplayName("Lanza excepción si startDate es posterior a endDate")
    void shouldThrowWhenStartDateAfterEndDate() {
        LocalDate startDate = LocalDate.now().plusMonths(2).withDayOfMonth(1);
        LocalDate endDate = LocalDate.now().plusMonths(1).withDayOfMonth(LocalDate.now().plusMonths(1).lengthOfMonth());

        assertThatThrownBy(() -> validator.validateBookingDates(startDate, endDate, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("La fecha de inicio debe ser anterior a la de fin.");
    }

    @Test
    @DisplayName("Lanza excepción si el alojamiento está lleno (solapamiento)")
    void shouldThrowWhenAccommodationIsFull() {
        LocalDate startDate = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        UUID listingId = UUID.randomUUID();

        when(listing.getId()).thenReturn(listingId);

        when(bookingRequestRepository.countOverlappingAcceptedBookings(listingId, startDate, endDate))
                .thenReturn(1L); // 1 active booking means full

        assertThatThrownBy(() -> validator.validateBookingDates(startDate, endDate, listing))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessage("El alojamiento ya está completo para las fechas seleccionadas.");
    }

    @Test
    @DisplayName("Pasa la validación si hay habitaciones libres")
    void shouldPassWhenAccommodationHasFreeRooms() {
        LocalDate startDate = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        UUID listingId = UUID.randomUUID();

        when(listing.getId()).thenReturn(listingId);

        when(bookingRequestRepository.countOverlappingAcceptedBookings(listingId, startDate, endDate))
                .thenReturn(0L); // 0 active bookings

        assertThatCode(() -> validator.validateBookingDates(startDate, endDate, listing))
                .doesNotThrowAnyException();
    }
}
