package com.vvu981.colivibackend.features.messaging.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.service.ConversationService;
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
    private ConversationService conversationService;

    @InjectMocks
    private BookingStatusChangedListener listener;

    @Test
    @DisplayName("Cuando se crea una solicitud, delega en conversationService para vincularla si existe conversación")
    void whenBookingRequestCreated_thenDelegateToConversationService() {
        UUID requestId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        UUID listingId = UUID.randomUUID();
        UUID hostId = UUID.randomUUID();

        BookingRequestCreatedEvent event = new BookingRequestCreatedEvent(
                requestId,
                requesterId,
                listingId,
                hostId,
                "host@colivi.com",
                "Juan Pérez",
                "tenant@colivi.com",
                "Habitación Centro",
                java.time.LocalDate.now(),
                java.time.LocalDate.now().plusMonths(1),
                "Hola"
        );

        listener.onBookingRequestCreated(event);

        verify(conversationService, times(1)).linkBookingRequestIfExists(
                requesterId,
                hostId,
                listingId,
                requestId
        );
    }

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

        verify(conversationService, times(1)).unlinkBookingRequest(bookingId);
    }

    @Test
    @DisplayName("Cuando la reserva expira, desvincula la solicitud de la conversación")
    void whenBookingIsExpired_thenUnlinkBookingRequest() {
        UUID bookingId = UUID.randomUUID();
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                bookingId,
                "tenant@colivi.com",
                "Habitación Centro",
                RequestStatus.EXPIRED,
                false,
                null,
                false);

        listener.onBookingStatusChanged(event);

        verify(conversationService, times(1)).unlinkBookingRequest(bookingId);
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

        verify(conversationService, times(1)).unlinkBookingRequest(bookingId);
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

        verify(conversationService, never()).unlinkBookingRequest(any());
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

        verify(conversationService, never()).unlinkBookingRequest(any());
    }
}
