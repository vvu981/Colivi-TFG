package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;

@Component
public class StartDateFilter implements BookingRequestFilter {
    @Override
    public boolean isApplicable(BookingRequestAdminFilterDto dto) {
        return dto.startDate() != null;
    }

    @Override
    public Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto dto) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDate"), dto.startDate());
    }
}
