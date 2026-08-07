package com.vvu981.colivibackend.features.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinHomeRequest(
        @NotBlank(message = "El código de invitación no puede estar vacío")
        @Size(min = 8, max = 50, message = "El código de invitación debe tener entre 8 y 50 caracteres")
        String invitationCode
) {}
