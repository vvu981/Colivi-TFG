package com.vvu981.colivibackend.features.accommodation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccommodationListingUpdateRequest(

                @NotBlank(message = "Title is required") String title,

                @NotBlank(message = "Description is required") String description,

                @NotNull(message = "Price per month is required") @Min(value = 1, message = "Price per month must be greater than 0") BigDecimal pricePerMonth,

                @NotNull(message = "Security deposit is required") @Min(value = 0, message = "Security deposit cannot be negative") BigDecimal securityDeposit,

                List<UUID> selectedImages) {

}
