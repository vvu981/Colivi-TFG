package com.vvu981.colivibackend.core.exception;

import com.vvu981.colivibackend.features.user.exception.AccountAlreadyActiveException;
import com.vvu981.colivibackend.features.user.exception.AccountBannedException;
import com.vvu981.colivibackend.features.user.exception.AccountDeletedException;
import com.vvu981.colivibackend.features.user.exception.InvalidReactivationTokenException;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import com.vvu981.colivibackend.features.user.exception.StaleSessionException;
import com.vvu981.colivibackend.features.user.exception.UserNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
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
        ResponseEntity<Map<String, Object>> response = handler.handleUnauthorized(exception);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Unauthorized", body.get("error"));
        assertEquals("Invalid token error", body.get("message"));
        assertEquals(HttpStatus.UNAUTHORIZED.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return Unauthorized_When StaleSessionException")
    void shouldReturnUnauthorized_WhenStaleSessionException() {
        // Arrange
        StaleSessionException exception = new StaleSessionException("Stale session error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleUnauthorized(exception);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Unauthorized", body.get("error"));
        assertEquals("Stale session error", body.get("message"));
        assertEquals(HttpStatus.UNAUTHORIZED.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return NotFound_When UserNotFoundException")
    void shouldReturnNotFound_WhenUserNotFoundException() {
        // Arrange
        UserNotFoundException exception = new UserNotFoundException("User not found error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(exception);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Not Found", body.get("error"));
        assertEquals("User not found error", body.get("message"));
        assertEquals(HttpStatus.NOT_FOUND.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return BadRequest_When InvalidReactivationTokenException")
    void shouldReturnBadRequest_WhenInvalidReactivationTokenException() {
        // Arrange
        InvalidReactivationTokenException exception = new InvalidReactivationTokenException("Token inválido");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleBadRequest(exception);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Bad Request", body.get("error"));
        assertEquals("Token inválido", body.get("message"));
        assertEquals(HttpStatus.BAD_REQUEST.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return BadRequest_When AccountAlreadyActiveException")
    void shouldReturnBadRequest_WhenAccountAlreadyActiveException() {
        // Arrange
        AccountAlreadyActiveException exception = new AccountAlreadyActiveException("Cuenta ya activa");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleBadRequest(exception);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Bad Request", body.get("error"));
        assertEquals("Cuenta ya activa", body.get("message"));
        assertEquals(HttpStatus.BAD_REQUEST.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return Forbidden_When AccountBannedException with default message")
    void shouldReturnForbidden_WhenAccountBannedException_DefaultMessage() {
        // Arrange — constructor sin argumento: usa el mensaje genérico
        AccountBannedException exception = new AccountBannedException();

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleForbidden(exception);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Forbidden", body.get("error"));
        assertEquals(HttpStatus.FORBIDDEN.value(), body.get("status"));
        assertNotNull(body.get("timestamp"));
        assertThat((String) body.get("message")).contains("suspendida");
    }

    @Test
    @DisplayName("should Return Forbidden_When AccountBannedException with explicit reason")
    void shouldReturnForbidden_WhenAccountBannedException_WithReason() {
        // Arrange — constructor con motivo explícito
        AccountBannedException exception = new AccountBannedException("Spam masivo");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleForbidden(exception);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Forbidden", body.get("error"));
        assertThat((String) body.get("message")).contains("Spam masivo");
        assertNotNull(body.get("timestamp"));
    }

    @Test
    @DisplayName("should Return Forbidden_When AccountDeletedException")
    void shouldReturnForbidden_WhenAccountDeletedException() {
        // Arrange
        AccountDeletedException exception = new AccountDeletedException();

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleForbidden(exception);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("Forbidden", body.get("error"));
        assertEquals(HttpStatus.FORBIDDEN.value(), body.get("status"));
        assertThat((String) body.get("message")).contains("reactivaci");
        assertNotNull(body.get("timestamp"));
    }
}
