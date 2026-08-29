package com.vvu981.colivibackend.features.bookingRequests.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingNotificationListener {

    private final EmailService emailService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingStatusChanged(BookingStatusChangedEvent event) {
        try {
            emailService.sendBookingStatusEmail(
                event.tenantEmail(),
                event.listingTitle(),
                event.isAccepted(),
                event.expiresAt()
            );
        } catch (Exception e) {
            log.error("Error enviando email de cambio de estado de reserva a {}: {}", event.tenantEmail(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        try {
            emailService.sendPaymentConfirmationToTenant(event.tenantEmail(), event.listingTitle());
            emailService.sendPaymentNotificationToLandlord(event.landlordEmail(), event.listingTitle());
        } catch (Exception e) {
            log.error("Error enviando emails de confirmación de reserva para listing {}: {}", event.accommodationListingId(), e.getMessage());
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingRequestCreated(BookingRequestCreatedEvent event) {
        try {
            emailService.sendNewBookingRequestToHost(
                event.requestId(),
                event.hostEmail(),
                event.tenantName(),
                event.tenantEmail(),
                event.listingTitle(),
                event.startDate(),
                event.endDate(),
                event.message()
            );
        } catch (Exception e) {
            log.error("Error enviando email de nueva solicitud a {}: {}", event.hostEmail(), e.getMessage());
        }
    }
}

