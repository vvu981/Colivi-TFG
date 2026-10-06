package com.vvu981.colivibackend.features.user.controller;

import com.vvu981.colivibackend.features.user.dto.AuthResponse;
import com.vvu981.colivibackend.features.user.dto.LoginRequest;
import com.vvu981.colivibackend.features.user.dto.GoogleLoginRequest;
import com.vvu981.colivibackend.features.user.dto.ReactivateAccountRequest;
import com.vvu981.colivibackend.features.user.dto.ReactivationRequestDto;
import com.vvu981.colivibackend.features.user.dto.RefreshTokenRequest;
import com.vvu981.colivibackend.features.user.dto.RegisterRequest;
import com.vvu981.colivibackend.features.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador que agrupa todos los endpoints de autenticación de Colivi.
 *
 * <p>Todos los endpoints aquí definidos son públicos (no requieren JWT).
 * La seguridad de los endpoints protegidos se configura en {@code SecurityConfig}.</p>
 *
 * <p>Base path: {@code /api/v1/auth}</p>
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = userService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = userService.loginWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = userService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Paso 1 del flujo de reactivación: solicitar el correo con el enlace.
     *
     * <p>El usuario envía su email. El sistema localiza la cuenta (aunque esté
     * soft-deleted), genera un token de reactivación y envía el enlace por correo.</p>
     *
     * <p><strong>Respuesta:</strong> siempre {@code 200 OK} sin cuerpo, incluso si
     * el email no existe (anti user-enumeration attack).</p>
     *
     * @param request payload con el email del usuario.
     * @return {@code 200 OK} vacío.
     */
    @PostMapping("/reactivation-request")
    public ResponseEntity<Void> requestReactivation(
            @Valid @RequestBody ReactivationRequestDto request) {

        userService.requestReactivation(request.email());
        return ResponseEntity.ok().build();
    }

    /**
     * Paso 2 del flujo de reactivación: confirmar el token y reactivar la cuenta.
     *
     * <p>El frontend envía el token recibido por email. El sistema valida el token,
     * comprueba que no ha caducado, reactiva la cuenta y devuelve un
     * {@link AuthResponse} para autenticar al usuario directamente.</p>
     *
     * @param request payload con el token de reactivación.
     * @return {@code 200 OK} con {@link AuthResponse} (access + refresh token).
     */
    @PostMapping("/reactivate")
    public ResponseEntity<AuthResponse> reactivateAccount(
            @Valid @RequestBody ReactivateAccountRequest request) {

        AuthResponse response = userService.reactivateAccount(request.token());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @Valid @RequestBody com.vvu981.colivibackend.features.user.dto.ForgotPasswordRequestDto request) {
        
        userService.forgotPassword(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @Valid @RequestBody com.vvu981.colivibackend.features.user.dto.ResetPasswordRequestDto request) {
        
        userService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
