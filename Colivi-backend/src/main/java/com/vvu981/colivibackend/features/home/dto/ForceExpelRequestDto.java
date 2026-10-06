package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.Size;

public record ForceExpelRequestDto(
        @Size(max = 255, message = "La razón de la expulsión no puede exceder los 255 caracteres.")
        String reason
) {}
