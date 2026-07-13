package com.vvu981.colivibackend.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios del filtro de seguridad JWT.
 * Patrón: el filtro SIEMPRE llama a filterChain.doFilter() independientemente
 * del resultado de la validación del token (no interrumpe la cadena).
 * La autorización real la delega a Spring Security después.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter")
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private UserRepository userRepository;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private User activeUser;

    @BeforeEach
    void setUp() {
        // Limpiamos el SecurityContext antes de cada test para aislamiento total
        SecurityContextHolder.clearContext();

        activeUser = new User();
        activeUser.setId(UUID.randomUUID());
        activeUser.setEmail("victor@colivi.com");
        activeUser.setRole(UserRole.USER);
        activeUser.setTokenVersion(1);
    }

    // =========================================================================
    // Escenario 1: Sin cabecera Authorization
    // =========================================================================

    @Nested
    @DisplayName("cuando no hay cabecera Authorization")
    class NoAuthorizationHeader {

        @Test
        @DisplayName("la cadena de filtros continúa sin autenticar al usuario")
        void givenNoAuthHeader_whenFilter_thenChainContinuesAndNoAuthentication() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn(null);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, times(1)).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verifyNoInteractions(jwtTokenProvider, userRepository);
        }

        @Test
        @DisplayName("cabecera presente pero sin prefijo 'Bearer ' es ignorada")
        void givenNonBearerHeader_whenFilter_thenChainContinuesAndNoAuthentication() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, times(1)).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verifyNoInteractions(jwtTokenProvider, userRepository);
        }
    }

    // =========================================================================
    // Escenario 2: Token malformado / firma inválida
    // =========================================================================

    @Nested
    @DisplayName("cuando el token tiene firma inválida o está malformado")
    class InvalidToken {

        @Test
        @DisplayName("firma inválida: extractEmail lanza JwtException → no se autentica, cadena continúa")
        void givenInvalidSignature_whenFilter_thenNoAuthenticationAndChainContinues() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Bearer tampered.jwt.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenThrow(new JwtException("Firma inválida"));

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, times(1)).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }

        @Test
        @DisplayName("isTokenValid devuelve false → no se consulta la BD y no se autentica")
        void givenInvalidToken_whenFilter_thenRepositoryNotCalledAndNoAuthentication() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token.here");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(false);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, times(1)).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            verifyNoInteractions(userRepository);
        }
    }

    // =========================================================================
    // Escenario 3: Token caducado
    // =========================================================================

    @Nested
    @DisplayName("cuando el token está caducado")
    class ExpiredToken {

        @Test
        @DisplayName("isTokenValid devuelve false para token expirado → no autentica")
        void givenExpiredToken_whenFilter_thenNoAuthentication() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Bearer expired.jwt.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(false);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }
    }

    // =========================================================================
    // Escenario 4: Token con versión obsoleta (invalidación de sesión)
    // =========================================================================

    @Nested
    @DisplayName("cuando el token tiene una versión obsoleta (logout forzado)")
    class ObsoleteTokenVersion {

        @Test
        @DisplayName("versión del token (1) distinta a la del usuario en BD (2) → no autentica")
        void givenStaleTokenVersion_whenFilter_thenNoAuthentication() throws Exception {
            // Arrange — el usuario en BD tiene tokenVersion=2 (se le hizo logout forzado)
            activeUser.setTokenVersion(2);

            when(request.getHeader("Authorization")).thenReturn("Bearer valid.old.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(true);
            when(jwtTokenProvider.extractTokenVersion(anyString())).thenReturn(1); // token antiguo
            when(userRepository.findByEmail("victor@colivi.com"))
                    .thenReturn(Optional.of(activeUser));

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }
    }

    // =========================================================================
    // Escenario 5: Usuario no encontrado en BD
    // =========================================================================

    @Nested
    @DisplayName("cuando el usuario del token no existe en la base de datos")
    class UserNotFound {

        @Test
        @DisplayName("findByEmail vacío → no autentica, cadena continúa")
        void givenNonExistentUser_whenFilter_thenNoAuthentication() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Bearer valid.unknown.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("ghost@example.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(true);
            when(userRepository.findByEmail("ghost@example.com"))
                    .thenReturn(Optional.empty());

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }
    }

    // =========================================================================
    // Escenario 6: Flujo de éxito completo
    // =========================================================================

    @Nested
    @DisplayName("cuando el token es completamente válido")
    class SuccessfulAuthentication {

        @Test
        @DisplayName("popula el SecurityContext con el usuario y sus authorities correctas")
        void givenValidToken_whenFilter_thenSecurityContextPopulated() throws Exception {
            // Arrange
            when(request.getHeader("Authorization")).thenReturn("Bearer valid.complete.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(true);
            when(jwtTokenProvider.extractTokenVersion(anyString())).thenReturn(1);
            when(userRepository.findByEmail("victor@colivi.com"))
                    .thenReturn(Optional.of(activeUser));

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert — la cadena debe continuar siempre
            verify(filterChain).doFilter(request, response);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth).isNotNull();
            assertThat(auth.isAuthenticated()).isTrue();
            assertThat(auth.getPrincipal()).isEqualTo(activeUser);
            assertThat(auth.getAuthorities())
                    .extracting("authority")
                    .containsExactly("USER");
        }

        @Test
        @DisplayName("usuario ADMIN recibe authority 'ADMIN' en el SecurityContext")
        void givenAdminUser_whenFilter_thenAdminAuthoritySet() throws Exception {
            // Arrange
            activeUser.setRole(UserRole.ADMIN);

            when(request.getHeader("Authorization")).thenReturn("Bearer valid.admin.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");
            when(jwtTokenProvider.isTokenValid(anyString())).thenReturn(true);
            when(jwtTokenProvider.extractTokenVersion(anyString())).thenReturn(1);
            when(userRepository.findByEmail("victor@colivi.com"))
                    .thenReturn(Optional.of(activeUser));

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth).isNotNull();
            assertThat(auth.getAuthorities())
                    .extracting("authority")
                    .containsExactly("ADMIN");
        }
    }

    // =========================================================================
    // Escenario 7: Ya existe autenticación en el contexto (no se sobreescribe)
    // =========================================================================

    @Nested
    @DisplayName("cuando el SecurityContext ya tiene autenticación previa")
    class AlreadyAuthenticated {

        @Test
        @DisplayName("no se vuelve a llamar al repositorio ni se sobreescribe el contexto")
        void givenExistingAuthentication_whenFilter_thenRepositoryNotCalled() throws Exception {
            // Arrange — simulamos un contexto ya poblado
            SecurityContext existingContext = SecurityContextHolder.createEmptyContext();
            Authentication existingAuth = mock(Authentication.class);
            existingContext.setAuthentication(existingAuth);
            SecurityContextHolder.setContext(existingContext);

            when(request.getHeader("Authorization")).thenReturn("Bearer some.valid.token");
            when(jwtTokenProvider.extractEmail(anyString())).thenReturn("victor@colivi.com");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert — la BD nunca se consultó (early return)
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(userRepository);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isEqualTo(existingAuth);
        }

        // =========================================================================
        // Escenario 9: Email nulo en token
        // =========================================================================

        @Nested
        @DisplayName("cuando el token no contiene email")
        class NullEmail {

            @Test
            @DisplayName("extractEmail devuelve null → no autentica, cadena continúa")
            void givenNullEmail_whenFilter_thenNoAuthentication() throws Exception {
                // Arrange
                when(request.getHeader("Authorization")).thenReturn("Bearer no.email.token");
                when(jwtTokenProvider.extractEmail(anyString())).thenReturn(null);

                // Act
                filter.doFilterInternal(request, response, filterChain);

                // Assert
                verify(filterChain).doFilter(request, response);
                assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
            }
        }
    }
}
