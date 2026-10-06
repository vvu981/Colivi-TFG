package com.vvu981.colivibackend.features.user.exception;

// Para cuando el token está mal firmado, manipulado o caducado
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
