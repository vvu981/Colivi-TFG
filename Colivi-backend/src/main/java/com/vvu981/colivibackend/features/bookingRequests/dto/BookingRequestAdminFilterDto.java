package com.vvu981.colivibackend.features.bookingRequests.dto;

import com.vvu981.colivibackend.features.bookingRequests.domain.RequestStatus;

import java.time.LocalDate;
import java.util.UUID;

public record BookingRequestAdminFilterDto(
        UUID accommodationListingId,
        UUID requesterId, // Filtro para el Inquilino (Arrendatario)
        UUID hostId, // Filtro para el Casero (Arrendador)
        RequestStatus status, // Filtro por Estado (Pendiente, Aceptado, etc.)
        LocalDate startDate // Filtro por Fecha de Entrada
) {
}