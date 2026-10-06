package com.vvu981.colivibackend.features.bookingRequests.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingStatusChangedEvent;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        log.info("Booking confirmed for listing {}, cancelling overlapping requests", event.accommodationListingId());
        try {
            List<BookingRequest> overlappingRequests = bookingRequestRepository.findOverlappingRequests(
                    event.accommodationListingId(),
                    event.confirmedRequestId(),
                    event.startDate(),
                    event.endDate()
            );

            if (!overlappingRequests.isEmpty()) {
                int cancelledCount = bookingRequestRepository.cancelOtherRequestsByListingId(
                        event.accommodationListingId(),
                        event.confirmedRequestId(),
                        event.startDate(),
                        event.endDate()
                );
                List<UUID> overlappingIds = overlappingRequests.stream()
                        .map(BookingRequest::getId)
                        .toList();
                int unlinkedCount = conversationRepository.unlinkBookingRequests(overlappingIds);
                log.info("Cancelled {} overlapping requests and unlinked {} conversations for listing {}",
                        cancelledCount, unlinkedCount, event.accommodationListingId());

                for (BookingRequest req : overlappingRequests) {
                    try {
                        String tenantEmail = req.getRequester() != null ? req.getRequester().getEmail() : null;
                        String listingTitle = req.getAccommodationListing() != null ? req.getAccommodationListing().getTitle() : null;
                        boolean hasDeposit = req.getTransactionId() != null;
                        if (eventPublisher != null) {
                            eventPublisher.publishEvent(new BookingStatusChangedEvent(
                                    req.getId(),
                                    tenantEmail,
                                    listingTitle,
                                    RequestStatus.CANCELLED,
                                    false,
                                    null,
                                    hasDeposit
                            ));
                        }
                    } catch (Exception ex) {
                        log.error("Error publishing BookingStatusChangedEvent for request {}: {}", req.getId(), ex.getMessage());
                    }
                }
            } else {
                log.info("No overlapping requests to cancel for listing {}", event.accommodationListingId());
            }
        } catch (Exception e) {
            log.error("Failed to cancel overlapping requests for listing {}", event.accommodationListingId(), e);
        }
    }
}
