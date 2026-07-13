package com.vvu981.colivibackend.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios del filtro de verificación de estado de cuenta.
 *
 * <p>
 * Estrategia de cobertura:
 * <ul>
 * <li>Sin autenticación → pasa sin intervención.</li>
 * <li>Principal no es User → pasa sin intervención.</li>
 * <li>Usuario activo (no baneado, no eliminado) → pasa.</li>
 * <li>Usuario baneado sin motivo → 403 con mensaje genérico.</li>
 * <li>Usuario baneado con motivo → 403 con el motivo.</li>
 * <li>Usuario eliminado en ruta de reactivación → pasa.</li>
 * <li>Usuario eliminado en ruta de solicitud de reactivación → pasa.</li>
 * <li>Usuario eliminado en ruta protegida → 403.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserStatusEnforcerFilter")
class UserStatusEnforcerFilterTest {

    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private UserStatusEnforcerFilter filter;

    private User activeUser;

    // Reutilizamos el ObjectMapper real para capturar el cuerpo JSON escrito
    private final ObjectMapper realObjectMapper = new ObjectMapper();
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();

        activeUser = new User();
        activeUser.setId(UUID.randomUUID());
        activeUser.setEmail("victor@colivi.com");
        activeUser.setRole(UserRole.USER);
        activeUser.setTokenVersion(1);

        // Capturamos la salida del response para inspeccionar el JSON
        responseWriter = new StringWriter();
        lenient().when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
        // Usamos el ObjectMapper real para poder verificar el JSON escrito
        lenient().doAnswer(invocation -> {
            Object body = invocation.getArgument(1);
            realObjectMapper.writeValue(responseWriter, body);
            return null;
        }).when(objectMapper).writeValue(any(PrintWriter.class), any());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // HELPERS privados
    // =========================================================================

    private void authenticateUser(User user) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null,
                Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // =========================================================================
    // Escenario 1: Sin autenticación en el contexto
    // =========================================================================

    @Nested
    @DisplayName("cuando no hay autenticación en el SecurityContext")
    class NoAuthentication {

        @Test
        @DisplayName("authentication es null → cadena continúa sin verificar estado")
        void givenNullAuthentication_whenFilter_thenChainContinues() throws Exception {
            // Arrange — SecurityContext vacío (sin autenticación)
            // No se necesita setup adicional, clearContext() lo hizo en @BeforeEach

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }
    }

    // =========================================================================
    // Escenario 2: Principal no es una instancia de User
    // =========================================================================

    @Nested
    @DisplayName("cuando el principal no es un objeto User")
    class NonUserPrincipal {

        @Test
        @DisplayName("principal es String → cadena continúa sin verificar estado")
        void givenStringPrincipal_whenFilter_thenChainContinues() throws Exception {
            // Arrange — autenticación con un principal que NO es User (ej: String)
            Authentication auth = new UsernamePasswordAuthenticationToken("anonymous", null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }
    }

    // =========================================================================
    // Escenario 3: Usuario activo (estado correcto)
    // =========================================================================

    @Nested
    @DisplayName("cuando el usuario está activo (no baneado, no eliminado)")
    class ActiveUser {

        @Test
        @DisplayName("usuario en buen estado → cadena continúa sin bloqueo")
        void givenActiveUser_whenFilter_thenChainContinues() throws Exception {
            // Arrange — usuario sin bannedAt ni deletedAt
            authenticateUser(activeUser);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }
    }

    // =========================================================================
    // Escenario 4: Usuario baneado
    // =========================================================================

    @Nested
    @DisplayName("cuando el usuario está baneado")
    class BannedUser {

        @Test
        @DisplayName("baneado sin motivo → 403 con mensaje genérico, cadena NO continúa")
        void givenBannedUserWithoutReason_whenFilter_thenForbiddenAndChainStopped() throws Exception {
            // Arrange — baneado permanentemente, sin motivo registrado
            activeUser.setBannedAt(LocalDateTime.now());
            activeUser.setBanReason(null);
            authenticateUser(activeUser);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert — la cadena NUNCA se invoca
            verify(filterChain, never()).doFilter(any(), any());
            verify(response).setStatus(HttpStatus.FORBIDDEN.value());
            verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);

            // El cuerpo debe contener el mensaje genérico
            String json = responseWriter.toString();
            assertThat(json).contains("\"status\":403");
            assertThat(json).contains("Forbidden");
            assertThat(json).contains("sin motivo especificado");
        }

        @Test
        @DisplayName("baneado con motivo → 403 con el motivo específico, cadena NO continúa")
        void givenBannedUserWithReason_whenFilter_thenForbiddenWithReasonAndChainStopped() throws Exception {
            // Arrange — baneado con motivo explícito
            activeUser.setBannedAt(LocalDateTime.now());
            activeUser.setBanReason("Comportamiento inapropiado");
            authenticateUser(activeUser);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, never()).doFilter(any(), any());
            verify(response).setStatus(HttpStatus.FORBIDDEN.value());

            String json = responseWriter.toString();
            assertThat(json).contains("Comportamiento inapropiado");
        }

        @Test
        @DisplayName("ban temporal ya expirado → usuario NO baneado, cadena continúa")
        void givenExpiredBan_whenFilter_thenChainContinues() throws Exception {
            // Arrange — bannedUntil en el pasado (ban caducado)
            activeUser.setBannedAt(LocalDateTime.now().minusDays(10));
            activeUser.setBannedUntil(LocalDateTime.now().minusDays(1)); // ya expiró
            authenticateUser(activeUser);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert — isBanned() devuelve false → pasa
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }

        @Test
        @DisplayName("ban temporal aún activo → 403, cadena NO continúa")
        void givenActiveTemporaryBan_whenFilter_thenForbiddenAndChainStopped() throws Exception {
            // Arrange — bannedUntil en el futuro (ban aún vigente)
            activeUser.setBannedAt(LocalDateTime.now().minusDays(1));
            activeUser.setBannedUntil(LocalDateTime.now().plusDays(5));
            activeUser.setBanReason("Spam");
            authenticateUser(activeUser);

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, never()).doFilter(any(), any());
            verify(response).setStatus(HttpStatus.FORBIDDEN.value());

            String json = responseWriter.toString();
            assertThat(json).contains("Spam");
        }
    }

    // =========================================================================
    // Escenario 5: Usuario con eliminación lógica (soft-delete)
    // =========================================================================

    @Nested
    @DisplayName("cuando el usuario está eliminado lógicamente (deletedAt != null)")
    class DeletedUser {

        @BeforeEach
        void markAsDeleted() {
            activeUser.setDeletedAt(LocalDateTime.now().minusDays(2));
        }

        @Test
        @DisplayName("ruta /api/v1/auth/reactivate → se permite el acceso (excepción de reactivación)")
        void givenDeletedUser_onReactivatePath_whenFilter_thenChainContinues() throws Exception {
            // Arrange
            authenticateUser(activeUser);
            when(request.getRequestURI()).thenReturn("/api/v1/auth/reactivate");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }

        @Test
        @DisplayName("ruta /api/v1/auth/reactivate con query string → se permite (startsWith)")
        void givenDeletedUser_onReactivatePathWithQueryString_whenFilter_thenChainContinues() throws Exception {
            // Arrange
            authenticateUser(activeUser);
            when(request.getRequestURI()).thenReturn("/api/v1/auth/reactivate/confirm");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("ruta /api/v1/auth/request-reactivation → se permite el acceso")
        void givenDeletedUser_onRequestReactivationPath_whenFilter_thenChainContinues() throws Exception {
            // Arrange
            authenticateUser(activeUser);
            when(request.getRequestURI()).thenReturn("/api/v1/auth/request-reactivation");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain).doFilter(request, response);
            verifyNoInteractions(objectMapper);
        }

        @Test
        @DisplayName("ruta protegida cualquiera → 403 con mensaje de reactivación, cadena NO continúa")
        void givenDeletedUser_onProtectedPath_whenFilter_thenForbiddenAndChainStopped() throws Exception {
            // Arrange
            authenticateUser(activeUser);
            when(request.getRequestURI()).thenReturn("/api/v1/accommodations");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, never()).doFilter(any(), any());
            verify(response).setStatus(HttpStatus.FORBIDDEN.value());
            verify(response).setContentType(MediaType.APPLICATION_JSON_VALUE);

            String json = responseWriter.toString();
            assertThat(json).contains("\"status\":403");
            assertThat(json).contains("reactivaci\u00f3n");
        }

        @Test
        @DisplayName("ruta de perfil de usuario → 403 con mensaje de reactivación")
        void givenDeletedUser_onUserProfilePath_whenFilter_thenForbidden() throws Exception {
            // Arrange
            authenticateUser(activeUser);
            when(request.getRequestURI()).thenReturn("/api/v1/users/me");

            // Act
            filter.doFilterInternal(request, response, filterChain);

            // Assert
            verify(filterChain, never()).doFilter(any(), any());
            verify(response).setStatus(HttpStatus.FORBIDDEN.value());
        }
    }
}
