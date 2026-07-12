package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class LandlordIdFilter implements BookingRequestFilter {
    @Override
    public boolean isApplicable(BookingRequestAdminFilterDto dto) {
        return dto.hostId() != null;
    }

    @Override
    public Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto dto) {
        // Navega de la solicitud al anuncio (accommodationListing), de ahí al dueño
        // (host) y compara su ID
        return (root, query, cb) -> cb.equal(root.get("accommodationListing").get("host").get("id"), dto.hostId());
    }
}