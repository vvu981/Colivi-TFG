package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;

public record AccommodationListingResponse(
        UUID id,
        String title,
        String description,
        BigDecimal pricePerMonth,
        ListingStatus status,
        LocalDateTime createdAt,
        AccommodationResponse accommodation, // Reutilizamos tu DTO para enviar la info de la casa limpia
        UUID hostId,
        String hostNickname) {

    // 🔍 SOLUCIÓN: El constructor que Java estaba buscando desesperadamente para el
    // método .map()
    public AccommodationListingResponse(AccommodationListing listing) {
        this(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPricePerMonth(),
                listing.getStatus(),
                listing.getCreatedAt(),

                // Mapeamos de forma segura la entidad Accommodation a su DTO
                // AccommodationResponse
                listing.getAccommodation() != null
                        ? new AccommodationResponse(listing.getAccommodation())
                        : null,

                // Datos mínimos y seguros del casero
                listing.getHost() != null ? listing.getHost().getId() : null,
                listing.getHost() != null ? listing.getHost().getNickname() : null);
    }
}