package com.vvu981.colivibackend.features.user.exception;

// Para cuando el tokenVersion del JWT no coincide con el de la BD (logout forzado)
public class StaleSessionException extends RuntimeException {
    public StaleSessionException(String message) {
        super(message);
    }
}