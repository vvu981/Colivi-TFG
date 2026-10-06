package com.vvu981.colivibackend.features.accommodation.dto;

import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(
        @NotNull(message = "El estado no puede ser nulo") 
        ListingStatus status
) {
}
