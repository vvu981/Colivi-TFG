package com.vvu981.colivibackend.features.messaging.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequestCreatedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingStatusChangedListener {

    private final ConversationService conversationService;
    private final ConversationRepository conversationRepository;

    @EventListener
    @Transactional
    public void onBookingRequestCreated(BookingRequestCreatedEvent event) {
        if (event.requestId() == null || event.requesterId() == null || event.listingId() == null || event.hostId() == null) {
            return;
        }

        conversationRepository.findByTenantIdAndHostIdAndListingId(event.requesterId(), event.hostId(), event.listingId())
                .ifPresent(conversation -> {
                    log.info("Vinculando automáticamente nueva solicitud de reserva {} a conversación {}",
                            event.requestId(), conversation.getId());
                    conversationService.linkBookingRequest(conversation.getId(), event.requestId());
                });
    }

    @EventListener
    @Transactional
    public void onBookingStatusChanged(BookingStatusChangedEvent event) {
        if (event.bookingRequestId() == null) {
            return;
        }

        RequestStatus status = event.status();
        boolean isRejected = status == RequestStatus.REJECTED;
        boolean isExpired = status == RequestStatus.EXPIRED;
        boolean isCancelledWithoutDeposit = status == RequestStatus.CANCELLED && !event.hasDeposit();

        if (isRejected || isExpired || isCancelledWithoutDeposit) {
            log.info("Desvinculando reactivamente la reserva {} de cualquier conversación por estado {}", 
                    event.bookingRequestId(), status);
            conversationService.unlinkBookingRequest(event.bookingRequestId());
        }
    }
}

