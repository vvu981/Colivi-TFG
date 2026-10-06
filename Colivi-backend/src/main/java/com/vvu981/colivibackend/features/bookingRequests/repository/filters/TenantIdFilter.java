package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TenantIdFilter implements BookingRequestFilter {
    @Override
    public boolean isApplicable(BookingRequestAdminFilterDto dto) {
        return dto.requesterId() != null;
    }

    @Override
    public Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto dto) {
        // Navega desde la solicitud (root) hasta el objeto requester y compara su ID
        return (root, query, cb) -> cb.equal(root.get("requester").get("id"), dto.requesterId());
    }
}
