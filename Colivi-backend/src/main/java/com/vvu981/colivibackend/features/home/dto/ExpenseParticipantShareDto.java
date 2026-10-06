package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseParticipantShareDto(
        @NotNull(message = "El identificador del usuario participante es obligatorio")
        UUID userId,

        @NotNull(message = "El importe del participante es obligatorio")
        @DecimalMin(value = "0.01", message = "El importe del participante debe ser mayor que 0")
        @Digits(integer = 8, fraction = 2, message = "El importe del participante debe tener como máximo 2 decimales")
        BigDecimal amount
) {}
