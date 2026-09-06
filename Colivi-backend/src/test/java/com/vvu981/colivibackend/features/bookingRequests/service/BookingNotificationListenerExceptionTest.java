package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class BookingNotificationListenerExceptionTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private BookingNotificationListener listener;

    @Test
    @DisplayName("handleBookingStatusChanged catches and logs exception gracefully")
    void testHandleBookingStatusChangedException() {
        doThrow(new RuntimeException("Mail server down"))
                .when(emailService).sendBookingStatusEmail(anyString(), anyString(), anyBoolean(), any());

        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                "tenant@example.com",
                "Apartment 1",
                RequestStatus.ACCEPTED,
                true,
                LocalDateTime.now().plusDays(2)
        );

        assertDoesNotThrow(() -> listener.handleBookingStatusChanged(event));
    }

    @Test
    @DisplayName("handleBookingConfirmed catches and logs exception gracefully")
    void testHandleBookingConfirmedException() {
        doThrow(new RuntimeException("Mail server down"))
                .when(emailService).sendPaymentConfirmationToTenant(anyString(), anyString());

        BookingConfirmedEvent event = new BookingConfirmedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                "tenant@example.com",
                "landlord@example.com",
                "Apartment 1"
        );

        assertDoesNotThrow(() -> listener.handleBookingConfirmed(event));
    }

    @Test
    @DisplayName("handleBookingRequestCreated catches and logs exception gracefully")
    void testHandleBookingRequestCreatedException() {
        doThrow(new RuntimeException("Mail server down"))
                .when(emailService).sendNewBookingRequestToHost(
                        any(), anyString(), anyString(), anyString(), anyString(), any(), any(), anyString()
                );

        BookingRequestCreatedEvent event = new BookingRequestCreatedEvent(
                UUID.randomUUID(),
                "host@example.com",
                "Tenant Name",
                "tenant@example.com",
                "Apartment 1",
                LocalDate.now(),
                LocalDate.now().plusMonths(1),
                "Hello host"
        );

        assertDoesNotThrow(() -> listener.handleBookingRequestCreated(event));
    }
}
