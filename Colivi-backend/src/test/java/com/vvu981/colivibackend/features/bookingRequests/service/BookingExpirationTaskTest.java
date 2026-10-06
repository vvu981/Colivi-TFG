package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingExpirationTask Unit Tests")
class BookingExpirationTaskTest {

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingExpirationTask bookingExpirationTask;

    @Test
    @DisplayName("Cuando no hay solicitudes expiradas, no realiza guardado ni modificaciones")
    void whenNoExpiredRequests_thenDoNothing() {
        when(bookingRequestRepository.findByStatusAndExpiresAtBefore(eq(RequestStatus.ACCEPTED), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        bookingExpirationTask.expireUnpaidRequests();

        verify(bookingRequestRepository, never()).saveAll(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Cuando hay solicitudes expiradas, ejecuta expire() y las persiste")
    void whenExpiredRequestsExist_thenExpireAndSaveAll() {
        BookingRequest request1 = mock(BookingRequest.class);
        BookingRequest request2 = mock(BookingRequest.class);
        User mockRequester = mock(User.class);
        AccommodationListing mockListing = mock(AccommodationListing.class);

        when(mockRequester.getEmail()).thenReturn("tenant@example.com");
        when(mockListing.getTitle()).thenReturn("Habitación Centro");

        when(request1.getId()).thenReturn(UUID.randomUUID());
        when(request1.getRequester()).thenReturn(mockRequester);
        when(request1.getAccommodationListing()).thenReturn(mockListing);

        when(request2.getId()).thenReturn(UUID.randomUUID());
        when(request2.getRequester()).thenReturn(mockRequester);
        when(request2.getAccommodationListing()).thenReturn(mockListing);

        List<BookingRequest> expiredList = List.of(request1, request2);

        when(bookingRequestRepository.findByStatusAndExpiresAtBefore(eq(RequestStatus.ACCEPTED), any(LocalDateTime.class)))
                .thenReturn(expiredList);

        bookingExpirationTask.expireUnpaidRequests();

        verify(request1).expire();
        verify(request2).expire();
        verify(bookingRequestRepository).saveAll(expiredList);
        verify(eventPublisher, times(2)).publishEvent(any(BookingStatusChangedEvent.class));
    }

    @Test
    @DisplayName("Si una solicitud lanza excepción al expirar, se captura el error y se procesa el resto")
    void whenRequestFailsToExpire_thenCatchErrorAndContinue() {
        BookingRequest faultyRequest = mock(BookingRequest.class);
        BookingRequest validRequest = mock(BookingRequest.class);
        User mockRequester = mock(User.class);
        AccommodationListing mockListing = mock(AccommodationListing.class);

        when(mockRequester.getEmail()).thenReturn("tenant@example.com");
        when(mockListing.getTitle()).thenReturn("Habitación Centro");

        when(faultyRequest.getId()).thenReturn(UUID.randomUUID());
        when(validRequest.getId()).thenReturn(UUID.randomUUID());
        when(validRequest.getRequester()).thenReturn(mockRequester);
        when(validRequest.getAccommodationListing()).thenReturn(mockListing);

        doThrow(new IllegalStateException("Invalid status transition")).when(faultyRequest).expire();

        List<BookingRequest> expiredList = List.of(faultyRequest, validRequest);

        when(bookingRequestRepository.findByStatusAndExpiresAtBefore(eq(RequestStatus.ACCEPTED), any(LocalDateTime.class)))
                .thenReturn(expiredList);

        bookingExpirationTask.expireUnpaidRequests();

        verify(faultyRequest).expire();
        verify(validRequest).expire();
        verify(bookingRequestRepository).saveAll(expiredList);
        verify(eventPublisher, times(1)).publishEvent(any(BookingStatusChangedEvent.class));
    }
}
