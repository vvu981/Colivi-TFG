package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequestDto(
        @NotBlank(message = "El token es obligatorio.")
        String token,

        @NotBlank(message = "La nueva contraseña es obligatoria.")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String newPassword
) {
}
