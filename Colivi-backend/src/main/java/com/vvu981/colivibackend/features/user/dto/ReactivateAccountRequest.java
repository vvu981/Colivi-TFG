package com.vvu981.colivibackend.features.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload del paso 2 del flujo de reactivación de cuenta.
 *
 * <p>El frontend envía el token UUID recibido en el correo electrónico.
 * El sistema valida el token, comprueba que no ha caducado, reactiva la cuenta
 * y devuelve un {@link AuthResponse} para que el usuario quede autenticado
 * directamente sin necesitar hacer login adicional.</p>
 *
 * @param token token UUID de reactivación enviado por email al usuario.
 */
public record ReactivateAccountRequest(

        @NotBlank(message = "El token de reactivación es obligatorio.")
        String token
) {
}
