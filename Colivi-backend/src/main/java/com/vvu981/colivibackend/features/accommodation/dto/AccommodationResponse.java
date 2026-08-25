package com.vvu981.colivibackend.features.accommodation.dto;

import com.vvu981.colivibackend.features.accommodation.domain.Accommodation;
import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record AccommodationResponse(
                UUID id,
                String address,
                Integer totalRooms,
                Integer totalBathrooms,
                Integer freeRooms,
                Integer squareMeters,
                String city,
                String country,
                String province,
                Double latitude,
                Double longitude,
                LocalDateTime deletedAt,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                Set<AmenityType> amenities,
                UUID ownerId,
                String ownerNickname,
                String ownerProfilePicUrl,
                List<AccommodationImageResponse> images) {

        public AccommodationResponse(Accommodation accommodation) {
                this(
                                accommodation != null ? accommodation.getId() : null,
                                accommodation != null ? accommodation.getAddress() : null,
                                accommodation != null ? accommodation.getTotalRooms() : null,
                                accommodation != null ? accommodation.getTotalBathrooms() : null,
                                accommodation != null ? accommodation.getFreeRooms() : null,
                                accommodation != null ? accommodation.getSquareMeters() : null,
                                accommodation != null ? accommodation.getCity() : null,
                                accommodation != null ? accommodation.getCountry() : null,
                                accommodation != null ? accommodation.getProvince() : null,
                                accommodation != null ? accommodation.getLatitude() : null,
                                accommodation != null ? accommodation.getLongitude() : null,
                                accommodation != null ? accommodation.getDeletedAt() : null,
                                accommodation != null ? accommodation.getCreatedAt() : null,
                                accommodation != null ? accommodation.getUpdatedAt() : null,

                                accommodation != null && accommodation.getAmenities() != null
                                                ? new HashSet<>(accommodation.getAmenities())
                                                : new HashSet<>(),

                                accommodation != null && accommodation.getOwner() != null ? accommodation.getOwner().getId() : null,
                                accommodation != null && accommodation.getOwner() != null ? accommodation.getOwner().getNickname() : null,
                                accommodation != null && accommodation.getOwner() != null ? accommodation.getOwner().getProfilePicUrl() : null,

                                accommodation != null && accommodation.getImages() != null
                                                ? accommodation.getImages().stream()
                                                                .map(img -> new AccommodationImageResponse(
                                                                                img.getId(),
                                                                                img.getImageUrl(),
                                                                                img.getDisplayOrder()))
                                                                .collect(Collectors.toList())
                                                : new ArrayList<>());
        }
}
