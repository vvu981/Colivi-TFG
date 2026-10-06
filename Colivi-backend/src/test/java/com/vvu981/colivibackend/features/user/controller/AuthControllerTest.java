package com.vvu981.colivibackend.features.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.features.user.dto.AuthResponse;
import com.vvu981.colivibackend.features.user.dto.LoginRequest;
import com.vvu981.colivibackend.features.user.dto.ReactivateAccountRequest;
import com.vvu981.colivibackend.features.user.dto.ReactivationRequestDto;
import com.vvu981.colivibackend.features.user.dto.RefreshTokenRequest;
import com.vvu981.colivibackend.features.user.dto.RegisterRequest;
import com.vvu981.colivibackend.features.user.exception.AccountAlreadyActiveException;
import com.vvu981.colivibackend.features.user.exception.InvalidReactivationTokenException;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import com.vvu981.colivibackend.features.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de capa web (slice test) para {@link AuthController}.
 *
 * <p>
 * Se levanta únicamente el contexto MVC con MockMvc. El {@link UserService}
 * está mockeado: solo verificamos que el controlador mapea correctamente
 * las rutas, delega al servicio y retorna los códigos HTTP esperados.
 * </p>
 */
@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // =========================================================================
    // register
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class Register {

        @Test
        @DisplayName("payload válido devuelve 200 con AuthResponse")
        void register_shouldReturnOkAndAuthResponse() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "nick", "email@colivi.com", "Pass123!", "Victor", "Val", "Lejo", "+34666666666");
            AuthResponse response = new AuthResponse("access", "refresh", 3600L);

            when(userService.register(any(RegisterRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("access"))
                    .andExpect(jsonPath("$.refreshToken").value("refresh"));
        }
    }

    // =========================================================================
    // login
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class Login {

        @Test
        @DisplayName("payload válido devuelve 200 con AuthResponse")
        void login_shouldReturnOkAndAuthResponse() throws Exception {
            LoginRequest request = new LoginRequest("email@colivi.com", "Pass123!");
            AuthResponse response = new AuthResponse("access", "refresh", 3600L);

            when(userService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("access"));
        }
    }

    // =========================================================================
    // refresh
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/refresh")
    class Refresh {

        @Test
        @DisplayName("payload válido devuelve 200 con nuevos tokens")
        void refresh_shouldReturnOkAndAuthResponse() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("valid_refresh_token");
            AuthResponse response = new AuthResponse("new_access", "new_refresh", 3600L);

            when(userService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("new_access"));
        }
    }

    // =========================================================================
    // reactivation-request (Paso 1)
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/reactivation-request")
    class ReactivationRequest {

        @Test
        @DisplayName("email de cuenta eliminada devuelve 200 OK vacío")
        void givenDeletedAccountEmail_whenRequestReactivation_thenReturns200() throws Exception {
            ReactivationRequestDto request = new ReactivationRequestDto("deleted@colivi.com");
            doNothing().when(userService).requestReactivation("deleted@colivi.com");

            mockMvc.perform(post("/api/v1/auth/reactivation-request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("email desconocido también devuelve 200 OK (anti user-enumeration: silencio)")
        void givenUnknownEmail_whenRequestReactivation_thenStillReturns200() throws Exception {
            // El servicio retorna silenciosamente sin lanzar excepción
            ReactivationRequestDto request = new ReactivationRequestDto("nobody@colivi.com");
            doNothing().when(userService).requestReactivation("nobody@colivi.com");

            mockMvc.perform(post("/api/v1/auth/reactivation-request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("cuenta ya activa: el servicio lanza AccountAlreadyActiveException → 400")
        void givenActiveAccount_whenRequestReactivation_thenReturns400() throws Exception {
            ReactivationRequestDto request = new ReactivationRequestDto("active@colivi.com");
            doThrow(new AccountAlreadyActiveException("La cuenta ya está activa."))
                    .when(userService).requestReactivation("active@colivi.com");

            mockMvc.perform(post("/api/v1/auth/reactivation-request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("email vacío en payload devuelve 400 (validación Bean Validation)")
        void givenBlankEmail_whenRequestReactivation_thenReturns400() throws Exception {
            // El record tiene @NotBlank, la validación debe cortar antes de llegar al
            // servicio
            String invalidBody = "{\"email\": \"\"}";

            mockMvc.perform(post("/api/v1/auth/reactivation-request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("email con formato inválido devuelve 400 (validación Bean Validation)")
        void givenMalformedEmail_whenRequestReactivation_thenReturns400() throws Exception {
            String invalidBody = "{\"email\": \"not-an-email\"}";

            mockMvc.perform(post("/api/v1/auth/reactivation-request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // reactivate (Paso 2)
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/reactivate")
    class Reactivate {

        private static final String VALID_TOKEN = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        @DisplayName("token válido devuelve 200 con AuthResponse (access + refresh tokens)")
        void givenValidToken_whenReactivate_thenReturns200WithAuthResponse() throws Exception {
            ReactivateAccountRequest request = new ReactivateAccountRequest(VALID_TOKEN);
            AuthResponse response = new AuthResponse("react.access", "react.refresh", 86400000L);

            when(userService.reactivateAccount(VALID_TOKEN)).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/reactivate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("react.access"))
                    .andExpect(jsonPath("$.refreshToken").value("react.refresh"))
                    .andExpect(jsonPath("$.expiresIn").value(86400000L));
        }

        @Test
        @DisplayName("token inválido o inexistente: servicio lanza InvalidTokenException → 400")
        void givenInvalidToken_whenReactivate_thenReturns400() throws Exception {
            ReactivateAccountRequest request = new ReactivateAccountRequest("bad-token");
            doThrow(new InvalidReactivationTokenException("El enlace de reactivación no es válido."))
                    .when(userService).reactivateAccount("bad-token");

            mockMvc.perform(post("/api/v1/auth/reactivate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("token caducado: servicio lanza InvalidTokenException → 400")
        void givenExpiredToken_whenReactivate_thenReturns400() throws Exception {
            ReactivateAccountRequest request = new ReactivateAccountRequest(VALID_TOKEN);
            doThrow(new InvalidReactivationTokenException("El enlace de reactivación ha caducado."))
                    .when(userService).reactivateAccount(VALID_TOKEN);

            mockMvc.perform(post("/api/v1/auth/reactivate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("token vacío en payload devuelve 400 (validación Bean Validation)")
        void givenBlankToken_whenReactivate_thenReturns400() throws Exception {
            String invalidBody = "{\"token\": \"\"}";

            mockMvc.perform(post("/api/v1/auth/reactivate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("body sin campo token devuelve 400")
        void givenEmptyBody_whenReactivate_thenReturns400() throws Exception {
            mockMvc.perform(post("/api/v1/auth/reactivate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // loginWithGoogle
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/google")
    class GoogleLogin {

        @Test
        @DisplayName("payload válido devuelve 200 con AuthResponse")
        void givenValidIdToken_whenLoginWithGoogle_thenReturns200WithAuthResponse() throws Exception {
            com.vvu981.colivibackend.features.user.dto.GoogleLoginRequest request =
                    new com.vvu981.colivibackend.features.user.dto.GoogleLoginRequest("valid-google-id-token");
            AuthResponse response = new AuthResponse("google.access", "google.refresh", 3600L);

            when(userService.loginWithGoogle(any(com.vvu981.colivibackend.features.user.dto.GoogleLoginRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("google.access"))
                    .andExpect(jsonPath("$.refreshToken").value("google.refresh"))
                    .andExpect(jsonPath("$.expiresIn").value(3600L));
        }

        @Test
        @DisplayName("payload con idToken en blanco devuelve 400")
        void givenBlankIdToken_whenLoginWithGoogle_thenReturns400() throws Exception {
            String invalidBody = "{\"idToken\": \"\"}";

            mockMvc.perform(post("/api/v1/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // forgot-password
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/forgot-password")
    class ForgotPassword {

        @Test
        @DisplayName("email válido devuelve 200 OK")
        void givenValidEmail_whenForgotPassword_thenReturns200() throws Exception {
            com.vvu981.colivibackend.features.user.dto.ForgotPasswordRequestDto request =
                    new com.vvu981.colivibackend.features.user.dto.ForgotPasswordRequestDto("user@colivi.com");

            doNothing().when(userService).forgotPassword("user@colivi.com");

            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("email inválido devuelve 400")
        void givenInvalidEmail_whenForgotPassword_thenReturns400() throws Exception {
            String invalidBody = "{\"email\": \"not-an-email\"}";

            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // reset-password
    // =========================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/reset-password")
    class ResetPassword {

        @Test
        @DisplayName("token y password válidos devuelve 204 No Content")
        void givenValidTokenAndPassword_whenResetPassword_thenReturns204() throws Exception {
            com.vvu981.colivibackend.features.user.dto.ResetPasswordRequestDto request =
                    new com.vvu981.colivibackend.features.user.dto.ResetPasswordRequestDto("valid-reset-token", "NewPass123!");

            doNothing().when(userService).resetPassword("valid-reset-token", "NewPass123!");

            mockMvc.perform(post("/api/v1/auth/reset-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("password débil devuelve 400")
        void givenWeakPassword_whenResetPassword_thenReturns400() throws Exception {
            String invalidBody = "{\"token\": \"some-token\", \"newPassword\": \"123\"}";

            mockMvc.perform(post("/api/v1/auth/reset-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidBody))
                    .andExpect(status().isBadRequest());
        }
    }
}
