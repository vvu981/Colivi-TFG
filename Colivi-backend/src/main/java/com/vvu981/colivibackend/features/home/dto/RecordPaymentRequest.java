package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record RecordPaymentRequest(
        @NotNull(message = "El pagador es obligatorio")
        UUID payerId,

        @NotNull(message = "El receptor es obligatorio")
        UUID receiverId,

        @NotNull(message = "El importe es obligatorio")
        @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
        @Digits(integer = 8, fraction = 2, message = "El importe debe tener como máximo 2 decimales")
        BigDecimal amount,

        @Size(max = 255, message = "El concepto o notas no pueden exceder 255 caracteres")
        String notes
) {}
