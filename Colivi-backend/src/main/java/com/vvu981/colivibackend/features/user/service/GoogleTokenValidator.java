package com.vvu981.colivibackend.features.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.vvu981.colivibackend.core.exception.UnauthorizedActionException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenValidator {

    private final GoogleIdTokenVerifier verifier;

    @org.springframework.beans.factory.annotation.Autowired
    public GoogleTokenValidator(@Value("${app.google.client-id}") String googleClientId) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Falta configuración de Google Auth (Client ID) en el servidor.");
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    GoogleTokenValidator(GoogleIdTokenVerifier verifier) {
        this.verifier = verifier;
    }

    public GoogleIdToken.Payload validateAndExtractPayload(String tokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(tokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("El token de Google no es válido.");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            if (payload.getEmailVerified() == null || !payload.getEmailVerified()) {
                throw new UnauthorizedActionException("El email proporcionado por Google no está verificado.");
            }
            return payload;
        } catch (IllegalArgumentException | UnauthorizedActionException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("El token de Google no es válido.", e);
        }
    }
}
