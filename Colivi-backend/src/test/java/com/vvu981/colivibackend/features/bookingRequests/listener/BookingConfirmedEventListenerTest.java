package com.vvu981.colivibackend.features.bookingRequests.listener;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingConfirmedEventListener Unit Tests")
class BookingConfirmedEventListenerTest {

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

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
    @DisplayName("debe cancelar las solicitudes superpuestas y desvincularlas de conversaciones y publicar evento")
    void handleBookingConfirmed_Success() {
        UUID overlappingId = UUID.randomUUID();
        User tenant = new User();
        tenant.setId(UUID.randomUUID());
        tenant.setEmail("tenant@example.com");
        AccommodationListing listing = AccommodationListing.builder().id(event.accommodationListingId()).title("Test Listing").build();
        BookingRequest overlappingBooking = BookingRequest.builder()
                .id(overlappingId)
                .requester(tenant)
                .accommodationListing(listing)
                .status(RequestStatus.PENDING)
                .build();

        when(bookingRequestRepository.findOverlappingRequests(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        )).thenReturn(List.of(overlappingBooking));

        when(bookingRequestRepository.cancelOtherRequestsByListingId(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        )).thenReturn(1);

        when(conversationRepository.unlinkBookingRequests(List.of(overlappingId))).thenReturn(1);

        listener.handleBookingConfirmed(event);

        verify(bookingRequestRepository, times(1)).cancelOtherRequestsByListingId(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        );
        verify(conversationRepository, times(1)).unlinkBookingRequests(List.of(overlappingId));
        verify(eventPublisher, times(1)).publishEvent(any(BookingStatusChangedEvent.class));
    }

    @Test
    @DisplayName("no debe cancelar ni desvincular si no hay solicitudes superpuestas")
    void handleBookingConfirmed_NoOverlapping() {
        when(bookingRequestRepository.findOverlappingRequests(
                event.accommodationListingId(),
                event.confirmedRequestId(),
                event.startDate(),
                event.endDate()
        )).thenReturn(List.of());

        listener.handleBookingConfirmed(event);

        verify(bookingRequestRepository, never()).cancelOtherRequestsByListingId(any(), any(), any(), any());
        verify(conversationRepository, never()).unlinkBookingRequests(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("debe manejar la excepcion y loguear error si ocurre un fallo")
    void handleBookingConfirmed_Exception() {
        when(bookingRequestRepository.findOverlappingRequests(
                any(), any(), any(), any()
        )).thenThrow(new RuntimeException("Database error"));

        listener.handleBookingConfirmed(event);

        verify(conversationRepository, never()).unlinkBookingRequests(any());
        verify(eventPublisher, never()).publishEvent(any());
    }
}
