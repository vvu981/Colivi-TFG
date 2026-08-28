package com.vvu981.colivibackend.features.bookingRequests.service;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;

@ExtendWith(MockitoExtension.class)
public class BookingNotificationListenerTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private BookingNotificationListener listener;

    @Test
    void handleBookingStatusChanged_shouldCallEmailService() {
        BookingStatusChangedEvent event = new BookingStatusChangedEvent(
                "tenant@example.com",
                "Beautiful Room",
                RequestStatus.ACCEPTED,
                true,
                java.time.LocalDateTime.now()
        );

        listener.handleBookingStatusChanged(event);

        verify(emailService).sendBookingStatusEmail(
                "tenant@example.com",
                "Beautiful Room",
                true,
                event.expiresAt()
        );
    }

    @Test
    void handleBookingConfirmed_shouldCallEmailService() {
        com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent event =
                new com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent(
                        java.util.UUID.randomUUID(),
                        java.util.UUID.randomUUID(),
                        java.time.LocalDate.now(),
                        java.time.LocalDate.now().plusMonths(1),
                        "tenant@example.com",
                        "host@example.com",
                        "Beautiful Room"
                );

        listener.handleBookingConfirmed(event);

        verify(emailService).sendPaymentConfirmationToTenant("tenant@example.com", "Beautiful Room");
        verify(emailService).sendPaymentNotificationToLandlord("host@example.com", "Beautiful Room");
    }

    @Test
    void handleBookingRequestCreated_shouldCallEmailService() {
        com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent event =
                new com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent(
                        "host@example.com",
                        "John Doe",
                        "Cozy Flat",
                        java.time.LocalDate.of(2026, 9, 1),
                        java.time.LocalDate.of(2027, 6, 30),
                        "Hola, me interesa la habitación."
                );

        listener.handleBookingRequestCreated(event);

        verify(emailService).sendNewBookingRequestToHost(
                "host@example.com",
                "John Doe",
                "Cozy Flat",
                java.time.LocalDate.of(2026, 9, 1),
                java.time.LocalDate.of(2027, 6, 30),
                "Hola, me interesa la habitación."
        );
    }
}
