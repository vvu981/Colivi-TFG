package com.vvu981.colivibackend.features.bookingRequests.listener;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingConfirmedEvent;
import com.vvu981.colivibackend.features.bookingRequests.repository.BookingRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingConfirmedEventListener {

    private final BookingRequestRepository bookingRequestRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        log.info("Booking confirmed for listing {}, cancelling overlapping requests", event.accommodationListingId());
        try {
            int cancelledCount = bookingRequestRepository.cancelOtherRequestsByListingId(
                    event.accommodationListingId(),
                    event.confirmedRequestId(),
                    event.startDate(),
                    event.endDate()
            );
            log.info("Cancelled {} overlapping requests for listing {}", cancelledCount, event.accommodationListingId());
        } catch (Exception e) {
            log.error("Failed to cancel overlapping requests for listing {}", event.accommodationListingId(), e);
        }
    }
}
