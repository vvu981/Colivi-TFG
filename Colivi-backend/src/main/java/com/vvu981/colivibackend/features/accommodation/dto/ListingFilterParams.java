package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ListingFilterParams(
        String city,
        String country,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer requiredFreeRooms,
        UUID hostId) {
}