package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;
import com.vvu981.colivibackend.features.home.repository.HomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Implementación por defecto de {@link InvitationCodeGenerator}.
 *
 * <p>Genera códigos alfanuméricos en mayúsculas de 8 caracteres usando {@link SecureRandom}
 * (resistente a predicción de secuencia según guías OWASP). Garantiza unicidad
 * consultando la base de datos antes de devolver el código.</p>
 */
@Component
@RequiredArgsConstructor
public class RandomAlphanumericCodeGenerator implements InvitationCodeGenerator {

    private static final String ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;
    private static final int MAX_ATTEMPTS = 10;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final HomeRepository homeRepository;

    @Override
    public String generate() {
        String code;
        int attempts = 0;
        do {
            if (attempts >= MAX_ATTEMPTS) {
                throw new BusinessRuleValidationException("No se pudo generar un código único de invitación tras " + MAX_ATTEMPTS + " intentos.");
            }
            code = generateRandom();
            attempts++;
        } while (homeRepository.existsByInvitationCode(code));
        return code;
    }

    private String generateRandom() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ALPHANUMERIC_CHARS.charAt(SECURE_RANDOM.nextInt(ALPHANUMERIC_CHARS.length())));
        }
        return sb.toString();
    }
}
