package com.vvu981.colivibackend.features.bookingRequests.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentConfirmationDto(
        @NotBlank(message = "Card number is required") String cardNumber,
        @NotBlank(message = "Cardholder name is required") String cardholderName,
        @NotBlank(message = "Expiry date is required") String expiryDate,
        @NotBlank(message = "CVV is required") String cvv
) {
}
