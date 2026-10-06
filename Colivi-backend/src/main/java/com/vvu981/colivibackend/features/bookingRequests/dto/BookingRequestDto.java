package com.vvu981.colivibackend.features.bookingRequests.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record BookingRequestDto(
                @NotNull(message = "El ID del anuncio es obligatorio.") UUID accommodationListingId,

                @NotNull(message = "La fecha de entrada es obligatoria.") @FutureOrPresent(message = "La fecha de entrada no puede ser una fecha pasada.") LocalDate startDate,

                @NotNull(message = "La fecha de salida es obligatoria.") @FutureOrPresent(message = "La fecha de salida no puede ser una fecha pasada.") LocalDate endDate,

                @Size(max = 1000, message = "El mensaje de presentación no puede superar los 1000 caracteres.") String message) {
}
