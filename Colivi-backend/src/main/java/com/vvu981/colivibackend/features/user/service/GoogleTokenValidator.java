package com.vvu981.colivibackend.features.user.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenValidator {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenValidator(@Value("${app.google.client-id}") String googleClientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    public GoogleIdToken.Payload validateAndExtractPayload(String tokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(tokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("El token de Google no es válido.");
            }
            return idToken.getPayload();
        } catch (Exception e) {
            throw new IllegalArgumentException("El token de Google no es válido.", e);
        }
    }
}
