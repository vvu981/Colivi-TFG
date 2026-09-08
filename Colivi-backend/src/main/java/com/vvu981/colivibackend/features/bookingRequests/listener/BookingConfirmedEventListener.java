package com.vvu981.colivibackend.features.bookingRequests.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingConfirmedEventListener {

    private final BookingRequestRepository bookingRequestRepository;
    private final ConversationRepository conversationRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        log.info("Booking confirmed for listing {}, cancelling overlapping requests", event.accommodationListingId());
        try {
            List<UUID> overlappingIds = bookingRequestRepository.findOverlappingRequestIds(
                    event.accommodationListingId(),
                    event.confirmedRequestId(),
                    event.startDate(),
                    event.endDate()
            );

            if (!overlappingIds.isEmpty()) {
                int cancelledCount = bookingRequestRepository.cancelOtherRequestsByListingId(
                        event.accommodationListingId(),
                        event.confirmedRequestId(),
                        event.startDate(),
                        event.endDate()
                );
                int unlinkedCount = conversationRepository.unlinkBookingRequests(overlappingIds);
                log.info("Cancelled {} overlapping requests and unlinked {} conversations for listing {}",
                        cancelledCount, unlinkedCount, event.accommodationListingId());
            } else {
                log.info("No overlapping requests to cancel for listing {}", event.accommodationListingId());
            }
        } catch (Exception e) {
            log.error("Failed to cancel overlapping requests for listing {}", event.accommodationListingId(), e);
        }
    }
}
