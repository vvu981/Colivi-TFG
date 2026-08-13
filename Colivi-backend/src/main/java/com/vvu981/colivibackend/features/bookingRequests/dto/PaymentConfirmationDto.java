package com.vvu981.colivibackend.features.bookingRequests.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentConfirmationDto(
        @NotBlank(message = "Payment token is required") String paymentToken,
        @NotBlank(message = "Payment method is required") String paymentMethod
) {
}
