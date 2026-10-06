package com.vvu981.colivibackend.features.user.exception;

/**
 * Se lanza cuando el token de reactivación de cuenta no es válido o ha caducado.
 *
 * <p>A diferencia de {@link InvalidTokenException} (que mapea a 401 y se usa para
 * tokens JWT de sesión), esta excepción mapea a <strong>400 Bad Request</strong>
 * porque el token de reactivación viene de un enlace público en el correo y
 * su invalidez es un error de solicitud del cliente, no un problema de autenticación.</p>
 */
public class InvalidReactivationTokenException extends RuntimeException {

    public InvalidReactivationTokenException(String message) {
        super(message);
    }
}
