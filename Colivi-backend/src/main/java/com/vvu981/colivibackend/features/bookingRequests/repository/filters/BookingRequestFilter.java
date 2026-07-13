package com.vvu981.colivibackend.features.bookingRequests.repository.filters;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.dto.BookingRequestAdminFilterDto;
import org.springframework.data.jpa.domain.Specification;

public interface BookingRequestFilter {
    // ¿El usuario ha rellenado este filtro en el DTO?
    boolean isApplicable(BookingRequestAdminFilterDto filterDto);

    // Si es aplicable, genera la condición SQL correspondiente
    Specification<BookingRequest> buildSpecification(BookingRequestAdminFilterDto filterDto);
}
