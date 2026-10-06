package com.vvu981.colivibackend.features.accommodation.dto;

import java.util.Set;

import com.vvu981.colivibackend.features.accommodation.domain.AmenityType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccommodationRequest(
        @NotBlank(message = "Address is required") String address,

        @NotNull(message = "Total rooms is required") @Min(value = 1, message = "Total rooms must be at least 1") Integer totalRooms,

        @NotNull(message = "Total bathrooms is required") @Min(value = 1, message = "Total bathrooms must be at least 1") Integer totalBathrooms,

        @NotNull(message = "Free rooms is required") @Min(value = 0, message = "Free rooms cannot be negative") Integer freeRooms,

        @NotNull(message = "Square meters is required") @Min(value = 1, message = "Square meters must be at least 1") Integer squareMeters,

        @NotBlank(message = "City is required") String city,

        @NotBlank(message = "Country is required") String country,

        @NotBlank(message = "Province is required") String province,

        @NotNull(message = "Latitude is required") Double latitude,

        @NotNull(message = "Longitude is required") Double longitude,

        @NotNull(message = "Amenities list cannot be null") Set<AmenityType> amenities) {
}
