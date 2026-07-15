package com.vvu981.colivibackend.features.bookingRequests.dto;

import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record BookingRequestResponseDto(
        UUID id,
        UUID requesterId,
        UUID accommodationListingId,
        LocalDate startDate,
        LocalDate endDate,
        String message,
        RequestStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * Constructor secundario para mapear la entidad de dominio directamente al DTO.
     * Rompe el acoplamiento en las capas superiores y centraliza la transformación.
     */
    public BookingRequestResponseDto(BookingRequest request) {
        this(
                request.getId(),
                request.getRequester() != null ? request.getRequester().getId() : null,
                request.getAccommodationListing() != null ? request.getAccommodationListing().getId() : null,
                request.getStartDate(),
                request.getEndDate(),
                request.getMessage(),
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
