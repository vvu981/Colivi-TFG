package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateHomeRequest(
        @NotBlank(message = "El nombre del hogar no puede estar vacío")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        String name
) {}
