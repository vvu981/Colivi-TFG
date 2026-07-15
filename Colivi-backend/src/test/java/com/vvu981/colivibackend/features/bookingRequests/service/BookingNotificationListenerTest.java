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
                true
        );

        listener.handleBookingStatusChanged(event);

        verify(emailService).sendBookingStatusEmail(
                "tenant@example.com",
                "Beautiful Room",
                true
        );
    }
}
