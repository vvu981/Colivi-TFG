package com.vvu981.colivibackend.features.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.UpdateNonSensible;
import com.vvu981.colivibackend.features.user.dto.UpdateSensible;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


/**
 * Tests de capa web para UserController usando @WebMvcTest con Security activa.
 *
 * PATRÓN CLAVE: NO se mockea el JwtAuthenticationFilter sino sus dependencias
 * (JwtTokenProvider y UserRepository). Esto permite que el filtro REAL se ejecute
 * en la cadena de seguridad, preservando los controles de acceso de @PreAuthorize
 * y la inyección de @AuthenticationPrincipal.
 *
 * - Sin cabecera Authorization → filtro no autentica → Spring Security rechaza con 401/403
 * - @WithMockUser → inyecta autenticación directamente en el SecurityContext (bypasa el filtro)
 * - authentication(buildAuth(user)) → inyecta el User entidad como principal vía MockMvc,
 *   replicando exactamente lo que hace JwtAuthenticationFilter.setSecurityContext()
 */
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@DisplayName("UserController (@WebMvcTest)")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- Dependencias del slice web ---
    @MockBean private UserService userService;

    // --- Dependencias del JwtAuthenticationFilter (filtro REAL, no mockeado) ---
    // Sin estas, el contexto no puede instanciar JwtAuthenticationFilter.
    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private UserRepository   userRepository;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = new User();
        authenticatedUser.setId(UUID.randomUUID());
        authenticatedUser.setEmail("victor@colivi.com");
        authenticatedUser.setNickname("vvu981");
        authenticatedUser.setFirstName("Víctor");
        authenticatedUser.setLastName1("Vallejo");
        authenticatedUser.setRole(UserRole.USER);
        authenticatedUser.setPasswordHash("$2a$12$hashed");
        authenticatedUser.setTokenVersion(1);
    }

    /**
     * Construye un UsernamePasswordAuthenticationToken con el User entidad como principal,
     * replicando exactamente lo que hace JwtAuthenticationFilter.setSecurityContext().
     * Necesario porque User no implementa UserDetails.
     */
    private UsernamePasswordAuthenticationToken buildAuth(User user) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
        return new UsernamePasswordAuthenticationToken(
                user, null, Collections.singletonList(authority)
        );
    }

    // =========================================================================
    // PATCH /api/v1/users/{userId}/admin
    // =========================================================================

    @Nested
    @DisplayName("PATCH /{userId}/admin — setAdmin")
    class SetAdminEndpoint {

        @Test
        @DisplayName("usuario con rol ADMIN recibe 200 OK")
        @WithMockUser(authorities = "ADMIN")
        void givenAdminUser_whenSetAdmin_thenReturns200() throws Exception {
            // Arrange
            UUID targetId = UUID.randomUUID();
            doNothing().when(userService).setAdmin(any(UUID.class));

            // Act & Assert
            mockMvc.perform(patch("/api/v1/users/{userId}/admin", targetId))
                    .andExpect(status().isOk());

            verify(userService).setAdmin(targetId);
        }

        @Test
        @DisplayName("usuario con rol USER recibe 403 Forbidden")
        @WithMockUser(authorities = "USER")
        void givenRegularUser_whenSetAdmin_thenReturns403() throws Exception {
            // Act & Assert — @PreAuthorize("hasAuthority('ADMIN')") bloquea al USER
            mockMvc.perform(patch("/api/v1/users/{userId}/admin", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 (Spring Security 6: AccessDeniedHandler activa primero)")
        void givenUnauthenticated_whenSetAdmin_thenReturns403() throws Exception {
            // Act & Assert
            // Spring Security 6 sin AuthenticationEntryPoint explícito devuelve 403
            // para usuarios anónimos que llegan a endpoints protegidos.
            mockMvc.perform(patch("/api/v1/users/{userId}/admin", UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/profile
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/profile — updateMyProfile (datos no sensibles)")
    class UpdateProfileEndpoint {

        @Test
        @DisplayName("usuario autenticado recibe 200 con DTO actualizado")
        void givenAuthenticatedUser_whenUpdateProfile_thenReturns200WithDto() throws Exception {
            // Arrange
            UpdateNonSensible requestDto = new UpdateNonSensible(
                    "nuevo_nick", "NuevoNombre", "NuevoApellido", null, "+34600000000", null
            );
            UpdateNonSensible responseDto = new UpdateNonSensible(
                    "nuevo_nick", "NuevoNombre", "NuevoApellido", null, "+34600000000", null
            );
            when(userService.updateNonSensibleData(any(User.class), any(UpdateNonSensible.class)))
                    .thenReturn(responseDto);

            // Act & Assert — authentication() inyecta el User entidad como @AuthenticationPrincipal
            mockMvc.perform(patch("/api/v1/users/me/profile")
                            .with(authentication(buildAuth(authenticatedUser)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.nickname").value("nuevo_nick"))
                    .andExpect(jsonPath("$.firstName").value("NuevoNombre"));
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 (Spring Security 6: AccessDeniedHandler activa primero)")
        void givenUnauthenticated_whenUpdateProfile_thenReturns403() throws Exception {
            UpdateNonSensible requestDto = new UpdateNonSensible(
                    "nick", "Name", "Last", null, null, null
            );

            mockMvc.perform(patch("/api/v1/users/me/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("@AuthenticationPrincipal pasa el User correcto al servicio (mismo email que el token)")
        void givenAuthenticatedUser_whenUpdateProfile_thenPrincipalEmailMatchesServiceCall() throws Exception {
            // Arrange
            UpdateNonSensible requestDto  = new UpdateNonSensible(null, "Nuevo", "Ap", null, null, null);
            UpdateNonSensible responseDto = new UpdateNonSensible("vvu981", "Nuevo", "Ap", null, null, null);
            when(userService.updateNonSensibleData(any(User.class), any(UpdateNonSensible.class)))
                    .thenReturn(responseDto);

            // Act
            mockMvc.perform(patch("/api/v1/users/me/profile")
                            .with(authentication(buildAuth(authenticatedUser)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isOk());

            // Assert — el User inyectado tiene el email correcto (anti-IDOR check)
            verify(userService).updateNonSensibleData(
                    argThat(u -> authenticatedUser.getEmail().equals(u.getEmail())),
                    any(UpdateNonSensible.class)
            );
        }
    }

    // =========================================================================
    // PATCH /api/v1/users/me/credentials
    // =========================================================================

    @Nested
    @DisplayName("PATCH /me/credentials — updateMyCredentials (datos sensibles)")
    class UpdateCredentialsEndpoint {

        @Test
        @DisplayName("usuario autenticado actualiza credenciales y recibe 200 OK")
        void givenAuthenticatedUser_whenUpdateCredentials_thenReturns200() throws Exception {
            // Arrange
            UpdateSensible requestDto = new UpdateSensible("currentPass", "new@email.com", null);
            doNothing().when(userService).updateSensibleData(any(User.class), any(UpdateSensible.class));

            // Act & Assert
            mockMvc.perform(patch("/api/v1/users/me/credentials")
                            .with(authentication(buildAuth(authenticatedUser)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isOk());

            verify(userService).updateSensibleData(
                    argThat(u -> authenticatedUser.getEmail().equals(u.getEmail())),
                    any(UpdateSensible.class)
            );
        }

        @Test
        @DisplayName("petición sin autenticación recibe 403 (Spring Security 6: AccessDeniedHandler activa primero)")
        void givenUnauthenticated_whenUpdateCredentials_thenReturns403() throws Exception {
            UpdateSensible requestDto = new UpdateSensible("currentPass", null, "newPass");

            mockMvc.perform(patch("/api/v1/users/me/credentials")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("RuntimeException del servicio se re-lanza en MockMvc (sin @ControllerAdvice, excepción sube hasta perform())")
        void givenServiceThrows_whenUpdateCredentials_thenExceptionPropagates() {
            // Arrange
            UpdateSensible requestDto = new UpdateSensible("wrongPass", null, null);
            doThrow(new RuntimeException("Error: la contraseña es incorrecta"))
                    .when(userService).updateSensibleData(any(User.class), any(UpdateSensible.class));

            // Act & Assert
            // Sin @ControllerAdvice, @WebMvcTest re-lanza la excepción en mockMvc.perform().
            // assertThatThrownBy captura la cadena de excepción: NestedServletException → RuntimeException.
            // En producción con un GlobalExceptionHandler, esto devolvería 500.
            assertThatThrownBy(() ->
                    mockMvc.perform(patch("/api/v1/users/me/credentials")
                            .with(authentication(buildAuth(authenticatedUser)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestDto)))
            )
            .hasRootCauseInstanceOf(RuntimeException.class)
            .hasRootCauseMessage("Error: la contraseña es incorrecta");
        }
    }
}

