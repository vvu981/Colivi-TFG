package com.vvu981.colivibackend.features.accommodation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull(message = "La puntuación es obligatoria.")
        @Min(value = 1, message = "La puntuación mínima es de 1 estrella.")
        @Max(value = 5, message = "La puntuación máxima es de 5 estrellas.")
        Integer rating,

        @Size(max = 2000, message = "El comentario no puede superar los 2000 caracteres.")
        String comment
) {}
