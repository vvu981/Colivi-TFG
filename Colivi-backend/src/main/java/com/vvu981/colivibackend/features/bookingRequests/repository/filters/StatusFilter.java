package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class StatusFilter implements BookingRequestFilter {
    @Override
    public boolean isApplicable(BookingRequestAdminFilterDto dto) {
        return dto.status() != null;
    }

    @Override
    public Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto dto) {
        return (root, query, cb) -> cb.equal(root.get("status"), dto.status());
    }
}
