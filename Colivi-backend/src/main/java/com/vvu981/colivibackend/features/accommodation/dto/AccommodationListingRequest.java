package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.vvu981.colivibackend.features.accommodation.domain.RentalType;

public record AccommodationListingRequest(
        @NotNull(message = "Accommodation ID is required") UUID accommodationId,

        @NotBlank(message = "Title is required") String title,

        @NotBlank(message = "Description is required") String description,

        @NotNull(message = "Price per month is required") @Min(value = 1, message = "Price per month must be greater than 0") BigDecimal pricePerMonth,

        @NotNull(message = "Rental type is required") RentalType rentalType // 👈 NUEVO CAMPO: El cliente enviará "ROOM"
                                                                            // o "ENTIRE_PLACE"
) {
}
