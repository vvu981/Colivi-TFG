package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;

@Component
public class ListingIdFilter implements BookingRequestFilter {

    @Override
    public boolean isApplicable(BookingRequestAdminFilterDto filterDto) {
        return filterDto.accommodationListingId() != null;

    }

    @Override
    public Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto filterDto) {
        return (root, query, cb) -> cb.equal(root.get("accommodationListing").get("id"),
                filterDto.accommodationListingId());

    }
}
