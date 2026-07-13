package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.UUID;

public record AccommodationImageOrderRequest(
        UUID imageId,
        Integer displayOrder) {
}
