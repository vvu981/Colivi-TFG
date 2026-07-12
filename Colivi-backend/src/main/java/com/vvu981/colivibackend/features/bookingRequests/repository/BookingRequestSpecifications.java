package com.vvu981.colivibackend.features.bookingRequests.repository;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;
import org.springframework.data.jpa.domain.Specification;
import java.util.UUID;

public class BookingRequestSpecifications {

    public static Specification<BookingRequest> hasListingId(UUID listingId) {
        return (root, query, cb) -> listingId == null ? null
                : cb.equal(root.get("accommodationListing").get("id"), listingId);
    }

    public static Specification<BookingRequest> hasRequesterId(UUID requesterId) {
        return (root, query, cb) -> requesterId == null ? null : cb.equal(root.get("requester").get("id"), requesterId);
    }

    public static Specification<BookingRequest> hasStatus(RequestStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }
}