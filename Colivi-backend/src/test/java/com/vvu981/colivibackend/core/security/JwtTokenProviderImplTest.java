package com.vvu981.colivibackend.core.security;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests unitarios para JwtTokenProviderImpl.
 * No requiere contexto Spring: instanciamos la clase directamente e inyectamos
 * los valores de @Value mediante ReflectionTestUtils.
 *
 * Clave secreta Base64 de 256 bits generada para tests (NO usar en producción).
 */
@DisplayName("JwtTokenProviderImpl")
class JwtTokenProviderImplTest {

    // Clave HMAC-SHA256 válida de 256 bits en Base64 (32 bytes)
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LWZvci1qdW5pdC10ZXN0cy0xMjM0NQ==";
    private static final long ACCESS_EXPIRATION  = 3_600_000L; // 1 hora
    private static final long REFRESH_EXPIRATION = 86_400_000L; // 24 horas

    private JwtTokenProviderImpl tokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProviderImpl();
        ReflectionTestUtils.setField(tokenProvider, "secretKey",        TEST_SECRET);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpiration",    ACCESS_EXPIRATION);
        ReflectionTestUtils.setField(tokenProvider, "refreshExpiration", REFRESH_EXPIRATION);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("victor@colivi.com");
        testUser.setRole(UserRole.USER);
        testUser.setTokenVersion(1);
    }

    // =========================================================================
    // generateAccessToken / generateRefreshToken
    // =========================================================================

    @Nested
    @DisplayName("generateAccessToken")
    class GenerateAccessToken {

        @Test
        @DisplayName("dado un usuario válido, produce un token no nulo y no vacío")
        void givenValidUser_whenGenerateAccessToken_thenTokenIsNotBlank() {
            // Act
            String token = tokenProvider.generateAccessToken(testUser);

            // Assert
            assertThat(token).isNotBlank();
        }

        @Test
        @DisplayName("el token contiene el email del usuario como subject")
        void givenValidUser_whenGenerateAccessToken_thenSubjectIsUserEmail() {
            // Arrange
            String token = tokenProvider.generateAccessToken(testUser);

            // Act
            String extractedEmail = tokenProvider.extractEmail(token);

            // Assert
            assertThat(extractedEmail).isEqualTo(testUser.getEmail());
        }

        @Test
        @DisplayName("el token contiene la versión del token correcta")
        void givenValidUser_whenGenerateAccessToken_thenTokenVersionMatchesUser() {
            // Arrange
            testUser.setTokenVersion(5);
            String token = tokenProvider.generateAccessToken(testUser);

            // Act
            Integer extractedVersion = tokenProvider.extractTokenVersion(token);

            // Assert
            assertThat(extractedVersion).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("generateRefreshToken")
    class GenerateRefreshToken {

        @Test
        @DisplayName("produce un token diferente al access token para el mismo usuario")
        void givenSameUser_whenGenerateBothTokens_thenTokensAreDifferent() {
            // Act
            String accessToken  = tokenProvider.generateAccessToken(testUser);
            String refreshToken = tokenProvider.generateRefreshToken(testUser);

            // Assert — no son el mismo string (distintos timestamps + expiration)
            assertThat(accessToken).isNotEqualTo(refreshToken);
        }

        @Test
        @DisplayName("el refresh token contiene el email correcto")
        void givenValidUser_whenGenerateRefreshToken_thenEmailExtracted() {
            String token = tokenProvider.generateRefreshToken(testUser);
            assertThat(tokenProvider.extractEmail(token)).isEqualTo(testUser.getEmail());
        }
    }

    // =========================================================================
    // isTokenValid
    // =========================================================================

    @Nested
    @DisplayName("isTokenValid")
    class IsTokenValid {

        @Test
        @DisplayName("devuelve true para un token recién generado")
        void givenFreshToken_whenIsTokenValid_thenReturnsTrue() {
            String token = tokenProvider.generateAccessToken(testUser);
            assertThat(tokenProvider.isTokenValid(token)).isTrue();
        }

        @Test
        @DisplayName("devuelve false para un token con firma inválida (manipulado)")
        void givenTamperedToken_whenIsTokenValid_thenReturnsFalse() {
            // Arrange — modificamos el último carácter de la firma
            String validToken   = tokenProvider.generateAccessToken(testUser);
            String tamperedToken = validToken.substring(0, validToken.length() - 3) + "xxx";

            // Act & Assert
            assertThat(tokenProvider.isTokenValid(tamperedToken)).isFalse();
        }

        @Test
        @DisplayName("devuelve false para un token completamente malformado")
        void givenMalformedToken_whenIsTokenValid_thenReturnsFalse() {
            assertThat(tokenProvider.isTokenValid("not.a.valid.jwt.token")).isFalse();
        }

        @Test
        @DisplayName("devuelve false para un token caducado (expiración en el pasado)")
        void givenExpiredToken_whenIsTokenValid_thenReturnsFalse() {
            // Arrange — sobreescribimos expiración a -1ms (ya caducó en el pasado)
            ReflectionTestUtils.setField(tokenProvider, "jwtExpiration", -1L);
            String expiredToken = tokenProvider.generateAccessToken(testUser);

            // Restauramos para no contaminar otros tests
            ReflectionTestUtils.setField(tokenProvider, "jwtExpiration", ACCESS_EXPIRATION);

            // Act & Assert
            assertThat(tokenProvider.isTokenValid(expiredToken)).isFalse();
        }

        @Test
        @DisplayName("devuelve false para cadena vacía")
        void givenEmptyString_whenIsTokenValid_thenReturnsFalse() {
            assertThat(tokenProvider.isTokenValid("")).isFalse();
        }
    }

    // =========================================================================
    // extractEmail
    // =========================================================================

    @Nested
    @DisplayName("extractEmail")
    class ExtractEmail {

        @Test
        @DisplayName("lanza excepción al extraer email de un token con firma inválida")
        void givenInvalidSignature_whenExtractEmail_thenThrows() {
            String valid    = tokenProvider.generateAccessToken(testUser);
            String tampered = valid.substring(0, valid.length() - 4) + "XXXX";

            assertThatThrownBy(() -> tokenProvider.extractEmail(tampered))
                    .isInstanceOf(Exception.class);
        }
    }

    // =========================================================================
    // extractTokenVersion
    // =========================================================================

    @Nested
    @DisplayName("extractTokenVersion")
    class ExtractTokenVersion {

        @Test
        @DisplayName("extrae correctamente tokenVersion = 1 por defecto")
        void givenDefaultTokenVersion_whenExtract_thenReturnsOne() {
            testUser.setTokenVersion(1);
            String token = tokenProvider.generateAccessToken(testUser);
            assertThat(tokenProvider.extractTokenVersion(token)).isEqualTo(1);
        }

        @Test
        @DisplayName("extrae correctamente tokenVersion > 1 tras invalidación")
        void givenIncrementedTokenVersion_whenExtract_thenReturnsCorrectVersion() {
            testUser.setTokenVersion(3);
            String token = tokenProvider.generateAccessToken(testUser);
            assertThat(tokenProvider.extractTokenVersion(token)).isEqualTo(3);
        }
    }
}
