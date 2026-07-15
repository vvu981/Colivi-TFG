package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class BookingNotificationListener {

    private final EmailService emailService;

    public BookingNotificationListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingStatusChanged(BookingStatusChangedEvent event) {
        emailService.sendBookingStatusEmail(
            event.tenantEmail(),
            event.listingTitle(),
            event.isAccepted()
        );
    }
}
