package com.vvu981.colivibackend.features.user.exception;

/**
 * Excepción lanzada cuando un usuario con eliminación lógica intenta acceder a un
 * recurso protegido distinto al de reactivación de cuenta.
 * Resulta en una respuesta HTTP 403 Forbidden con un mensaje orientativo.
 */
public class AccountDeletedException extends RuntimeException {

    public AccountDeletedException() {
        super("Tu cuenta ha sido desactivada. Puedes recuperarla a través del proceso de reactivación.");
    }
}
