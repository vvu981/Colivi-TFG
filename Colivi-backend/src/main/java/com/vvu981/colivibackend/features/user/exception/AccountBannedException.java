package com.vvu981.colivibackend.features.user.exception;

/**
 * Excepción lanzada cuando un usuario baneado intenta acceder a un recurso protegido.
 * Resulta en una respuesta HTTP 403 Forbidden.
 */
public class AccountBannedException extends RuntimeException {

    public AccountBannedException() {
        super("Tu cuenta ha sido suspendida y no puede realizar esta acción.");
    }

    public AccountBannedException(String reason) {
        super("Tu cuenta ha sido suspendida. Motivo: " + reason);
    }
}
