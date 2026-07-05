package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.UUID;

public record AccommodationImageResponse(
                UUID id,
                String imageUrl,
                int displayOrder) {

}