package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UpdateExpenseRequest(
        @NotBlank(message = "La descripción no puede estar vacía")
        @Size(max = 255, message = "La descripción no puede exceder los 255 caracteres")
        String description,

        @NotNull(message = "El importe total no puede ser nulo")
        @DecimalMin(value = "0.01", message = "El importe debe ser mayor que 0")
        @Digits(integer = 8, fraction = 2, message = "El importe debe tener como máximo 2 decimales")
        BigDecimal totalAmount,

        @NotNull(message = "El pagador es obligatorio")
        UUID payerId,

        @NotEmpty(message = "Debe haber al menos un participante")
        List<UUID> participantIds,

        @jakarta.validation.Valid
        List<ExpenseParticipantShareDto> customSplits
) {
        public UpdateExpenseRequest(String description, BigDecimal totalAmount, UUID payerId, List<UUID> participantIds) {
                this(description, totalAmount, payerId, participantIds, null);
        }
}
