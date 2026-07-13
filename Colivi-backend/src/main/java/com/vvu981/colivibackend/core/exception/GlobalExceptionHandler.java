package com.vvu981.colivibackend.core.exception;

import com.vvu981.colivibackend.features.user.exception.AccountAlreadyActiveException;
import com.vvu981.colivibackend.features.user.exception.AccountBannedException;
import com.vvu981.colivibackend.features.user.exception.AccountDeletedException;
import com.vvu981.colivibackend.features.user.exception.InvalidReactivationTokenException;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import com.vvu981.colivibackend.features.user.exception.StaleSessionException;
import com.vvu981.colivibackend.features.user.exception.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Usuario baneado → 403 Forbidden
    // Nota: normalmente UserStatusEnforcerFilter escribe la respuesta directamente.
    // Este handler actúa como red de seguridad si la excepción se lanza desde un
    // servicio.
    @ExceptionHandler(AccountBannedException.class)
    public ResponseEntity<Map<String, Object>> handleAccountBanned(AccountBannedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Forbidden");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    // Usuario eliminado (soft-delete) → 403 Forbidden con mensaje orientativo
    @ExceptionHandler(AccountDeletedException.class)
    public ResponseEntity<Map<String, Object>> handleAccountDeleted(AccountDeletedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Forbidden");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    // Tokens JWT de sesión inválidos/caducados → 401 Unauthorized
    @ExceptionHandler({ InvalidTokenException.class, StaleSessionException.class })
    public ResponseEntity<Map<String, Object>> handleUnauthorizedExceptions(RuntimeException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Unauthorized");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    // Recurso no existe → 404 Not Found
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFoundExceptions(UserNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    // Token de reactivación inválido o caducado → 400 Bad Request
    // Distinto de InvalidTokenException (401): el enlace de reactivación es
    // público,
    // su invalidez es un error de solicitud, no de autenticación.
    @ExceptionHandler(InvalidReactivationTokenException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidReactivationToken(
            InvalidReactivationTokenException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // Cuenta ya activa cuando se intenta reactivar → 400 Bad Request
    @ExceptionHandler(AccountAlreadyActiveException.class)
    public ResponseEntity<Map<String, Object>> handleAccountAlreadyActive(
            AccountAlreadyActiveException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // Errores de validación de campos (@Valid en los controladores) → 400 Bad
    // Request
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        body.put("message", "Validation failed");
        body.put("errors", errors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
