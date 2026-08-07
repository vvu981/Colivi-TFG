package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateExpenseRequest(
        @NotBlank(message = "La descripción no puede estar vacía")
        String description,

        @NotNull(message = "El importe total no puede ser nulo")
        @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
        BigDecimal totalAmount,

        @NotNull(message = "El pagador es obligatorio")
        UUID payerId,

        @NotEmpty(message = "Debe haber al menos un participante")
        List<UUID> participantIds
) {}
