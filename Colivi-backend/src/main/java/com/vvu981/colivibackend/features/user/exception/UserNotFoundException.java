package com.vvu981.colivibackend.features.user.exception;

// Para cuando el email del refresh token no coincide con ningún usuario activo
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}