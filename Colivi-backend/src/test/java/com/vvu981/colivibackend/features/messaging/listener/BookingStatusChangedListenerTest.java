package com.vvu981.colivibackend.features.messaging.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingStatusChangedListener Unit Tests")
class BookingStatusChangedListenerTest {

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private BookingStatusChangedListener listener;

    @Test
    @DisplayName("Cuando la reserva es rechazada, desvincula la solicitud de la conversación")
    void whenBookingIsRejected_thenUnlinkBookingRequest() {
        UUID bookingId = UUID.randomUUID();
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                bookingId,
                "tenant@colivi.com",
                "Habitación Centro",
                RequestStatus.REJECTED,
                false,
                null,
                false);

        listener.onBookingStatusChanged(event);

        verify(conversationRepository, times(1)).unlinkBookingRequest(bookingId);
    }

    @Test
    @DisplayName("Cuando la reserva es cancelada sin fianza previa, desvincula la solicitud")
    void whenBookingIsCancelledWithoutDeposit_thenUnlinkBookingRequest() {
        UUID bookingId = UUID.randomUUID();
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                bookingId,
                "tenant@colivi.com",
                "Habitación Centro",
                RequestStatus.CANCELLED,
                false,
                null,
                false // hasDeposit = false
        );

        listener.onBookingStatusChanged(event);

        verify(conversationRepository, times(1)).unlinkBookingRequest(bookingId);
    }

    @Test
    @DisplayName("Cuando la reserva es cancelada pero tiene fianza (hasDeposit=true), NO desvincula para permitir resolución de fianza")
    void whenBookingIsCancelledWithDeposit_thenDoNotUnlink() {
        UUID bookingId = UUID.randomUUID();
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                bookingId,
                "tenant@colivi.com",
                "Habitación Centro",
                RequestStatus.CANCELLED,
                false,
                null,
                true // hasDeposit = true
        );

        listener.onBookingStatusChanged(event);

        verify(conversationRepository, never()).unlinkBookingRequest(any());
    }

    @Test
    @DisplayName("Cuando la reserva es aceptada, no desvincula la solicitud")
    void whenBookingIsAccepted_thenDoNotUnlink() {
        UUID bookingId = UUID.randomUUID();
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                bookingId,
                "tenant@colivi.com",
                "Habitación Centro",
                RequestStatus.ACCEPTED,
                true,
                LocalDateTime.now().plusDays(3),
                false);

        listener.onBookingStatusChanged(event);

        verify(conversationRepository, never()).unlinkBookingRequest(any());
    }
}
