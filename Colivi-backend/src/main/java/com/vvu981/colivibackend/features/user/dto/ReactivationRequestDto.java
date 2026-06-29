package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload del paso 1 del flujo de reactivación de cuenta.
 *
 * <p>El usuario envía su dirección de correo electrónico. El sistema localiza
 * la cuenta (aunque esté soft-deleted), genera un token de reactivación y
 * lo envía por email. No requiere autenticación previa.</p>
 *
 * @param email dirección de correo electrónico asociada a la cuenta a reactivar.
 */
public record ReactivationRequestDto(

        @NotBlank(message = "El email es obligatorio.")
        @Email(message = "El formato del email no es válido.")
        String email
) {
}
