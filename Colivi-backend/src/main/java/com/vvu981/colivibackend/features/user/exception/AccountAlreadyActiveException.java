package com.vvu981.colivibackend.features.user.exception;

/**
 * Se lanza cuando se intenta reactivar una cuenta que no está eliminada (soft-delete).
 * Evita que un usuario activo genere tokens de reactivación innecesarios.
 */
public class AccountAlreadyActiveException extends RuntimeException {

    public AccountAlreadyActiveException(String message) {
        super(message);
    }
}
