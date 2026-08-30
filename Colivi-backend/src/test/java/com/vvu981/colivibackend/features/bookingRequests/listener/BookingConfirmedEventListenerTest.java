package com.vvu981.colivibackend.features.bookingRequests.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
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

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingConfirmedEventListener Unit Tests")
class BookingConfirmedEventListenerTest {

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @InjectMocks
    private BookingConfirmedEventListener listener;

    private BookingConfirmedEvent event;

    @BeforeEach
    void setUp() {
        event = new BookingConfirmedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                "tenant@example.com",
                "landlord@example.com",
                "Test Listing"
        );
    }

    @Test
    @DisplayName("debe cancelar las solicitudes superpuestas exitosamente")
    void handleBookingConfirmed_Success() {
        when(bookingRequestRepository.cancelOtherRequestsByListingId(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        )).thenReturn(5);

        listener.handleBookingConfirmed(event);

        verify(bookingRequestRepository, times(1)).cancelOtherRequestsByListingId(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        );
    }

    @Test
    @DisplayName("debe manejar la excepcion y loguear error si ocurre un fallo")
    void handleBookingConfirmed_Exception() {
        when(bookingRequestRepository.cancelOtherRequestsByListingId(
                any(), any(), any(), any()
        )).thenThrow(new RuntimeException("Database error"));

        listener.handleBookingConfirmed(event);

        verify(bookingRequestRepository, times(1)).cancelOtherRequestsByListingId(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        );
    }
}
