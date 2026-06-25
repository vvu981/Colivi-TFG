package com.vvu981.colivibackend.core.exception;

import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import com.vvu981.colivibackend.features.user.exception.StaleSessionException;
import com.vvu981.colivibackend.features.user.exception.UserNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("should Return Unauthorized_When InvalidTokenException")
    void shouldReturnUnauthorized_WhenInvalidTokenException() {
        // Arrange
        InvalidTokenException exception = new InvalidTokenException("Invalid token error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleUnauthorizedExceptions(exception);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Unauthorized", response.getBody().get("error"));
        assertEquals("Invalid token error", response.getBody().get("message"));
        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getBody().get("status"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    @DisplayName("should Return Unauthorized_When StaleSessionException")
    void shouldReturnUnauthorized_WhenStaleSessionException() {
        // Arrange
        StaleSessionException exception = new StaleSessionException("Stale session error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleUnauthorizedExceptions(exception);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Unauthorized", response.getBody().get("error"));
        assertEquals("Stale session error", response.getBody().get("message"));
        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getBody().get("status"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    @DisplayName("should Return NotFound_When UserNotFoundException")
    void shouldReturnNotFound_WhenUserNotFoundException() {
        // Arrange
        UserNotFoundException exception = new UserNotFoundException("User not found error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleNotFoundExceptions(exception);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Not Found", response.getBody().get("error"));
        assertEquals("User not found error", response.getBody().get("message"));
        assertEquals(HttpStatus.NOT_FOUND.value(), response.getBody().get("status"));
        assertNotNull(response.getBody().get("timestamp"));
    }
}
