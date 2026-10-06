package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateMemberColorRequestDto(
        @NotBlank(message = "El color no puede estar vacío")
        @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Formato de color hexadecimal inválido")
        String color
) {}
