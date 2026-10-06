package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSensible(
        @NotBlank(message = "La contraseña actual es obligatoria para confirmar los cambios")
        String currentPassword,

        String newEmail,
        String newPassword
) {}
