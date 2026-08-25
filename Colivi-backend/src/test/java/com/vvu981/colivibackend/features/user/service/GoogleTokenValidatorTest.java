package com.vvu981.colivibackend.features.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.security.GeneralSecurityException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleTokenValidatorTest {

    @Mock
    private GoogleIdTokenVerifier verifier;

    @Test
    @DisplayName("Debe lanzar IllegalStateException si el client-id es nulo o vacío en el constructor estándar")
    void shouldThrowExceptionWhenClientIdMissing() {
        assertThrows(IllegalStateException.class, () -> new GoogleTokenValidator((String) null));
        assertThrows(IllegalStateException.class, () -> new GoogleTokenValidator("   "));
    }

    @Test
    @DisplayName("Debe validar y retornar payload cuando el token es válido y el email está verificado")
    void shouldValidateAndReturnPayloadSuccessfully() throws GeneralSecurityException, IOException {
        GoogleTokenValidator validator = new GoogleTokenValidator(verifier);
        GoogleIdToken idToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("test@gmail.com");

        when(verifier.verify("valid-token")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);

        GoogleIdToken.Payload result = validator.validateAndExtractPayload("valid-token");

        assertNotNull(result);
        assertEquals("test@gmail.com", result.getEmail());
    }

    @Test
    @DisplayName("Debe lanzar IllegalArgumentException si verifier retorna null")
    void shouldThrowWhenTokenIsNull() throws GeneralSecurityException, IOException {
        GoogleTokenValidator validator = new GoogleTokenValidator(verifier);
        when(verifier.verify("invalid-token")).thenReturn(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndExtractPayload("invalid-token")
        );
        assertEquals("El token de Google no es válido.", ex.getMessage());
    }

    @Test
    @DisplayName("Debe lanzar UnauthorizedActionException si emailVerified es null o false")
    void shouldThrowWhenEmailNotVerified() throws GeneralSecurityException, IOException {
        GoogleTokenValidator validator = new GoogleTokenValidator(verifier);
        GoogleIdToken idToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmailVerified(false);

        when(verifier.verify("unverified-token")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);

        UnauthorizedActionException ex = assertThrows(UnauthorizedActionException.class, () ->
                validator.validateAndExtractPayload("unverified-token")
        );
        assertEquals("El email proporcionado por Google no está verificado.", ex.getMessage());

        // Test with null emailVerified
        payload.setEmailVerified(null);
        assertThrows(UnauthorizedActionException.class, () ->
                validator.validateAndExtractPayload("unverified-token")
        );
    }

    @Test
    @DisplayName("Debe envolver excepciones checked en IllegalArgumentException")
    void shouldWrapGeneralException() throws GeneralSecurityException, IOException {
        GoogleTokenValidator validator = new GoogleTokenValidator(verifier);
        when(verifier.verify("error-token")).thenThrow(new IOException("Network error"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndExtractPayload("error-token")
        );
        assertEquals("El token de Google no es válido.", ex.getMessage());
        assertNotNull(ex.getCause());
    }
}
