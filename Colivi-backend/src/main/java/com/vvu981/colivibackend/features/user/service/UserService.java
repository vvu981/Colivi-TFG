package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.dto.*;

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.UUID;

public interface UserService {

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse loginWithGoogle(GoogleLoginRequest request);

    AuthResponse register(RegisterRequest request);


    AuthResponse refreshToken(RefreshTokenRequest request);

    void setAdmin(UUID targetUserId);

    UpdateNonSensible updateNonSensibleData(UUID userId, UpdateNonSensible updateData);

    /**
     * Sube una nueva foto de perfil a Cloudinary y actualiza la URL en el usuario.
     *
     * @param userId ID del usuario autenticado.
     * @param file   imagen enviada como multipart/form-data.
     * @return URL pública de la imagen subida.
     */
    String uploadProfilePicture(UUID userId, MultipartFile file);

    void updateSensibleData(UUID userId, UpdateSensible updateSensible);

    void deleteUserSoft(UUID userId);

    void deleteUserHard(UUID userId);

    void logout(UUID userId);

    void banUser(UUID userId, String message, LocalDateTime bannedUntil);

    void unbanUser(UUID userId);

    UserProfileResponse getUserProfile(UUID userId);

    MyProfileResponse getMyProfile(UUID userId);
    
    AdminUserProfileResponse getAdminUserProfile(UUID userId);

    org.springframework.data.domain.Page<AdminUserProfileResponse> searchUsersForAdmin(
            String query,
            com.vvu981.colivibackend.features.user.domain.UserRole role,
            Boolean banned,
            Boolean deleted,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Paso 1 del flujo de reactivación.
     *
     * <p>Localiza la cuenta por email (incluso si está soft-deleted), genera un
     * token UUID con TTL de 24 horas, lo persiste en base de datos y envía un
     * correo al usuario con el enlace de reactivación.</p>
     *
     * <p>Si la cuenta ya está activa, lanza {@code AccountAlreadyActiveException}.
     * Si el email no existe, por seguridad no se revela el error (respuesta silenciosa).</p>
     *
     * @param email dirección de correo del usuario que quiere reactivar su cuenta.
     */
    void requestReactivation(String email);

    /**
     * Paso 2 del flujo de reactivación.
     *
     * <p>Valida el token recibido, comprueba que no ha caducado, restaura la cuenta
     * (limpia {@code deletedAt}), limpia el token y devuelve un {@link AuthResponse}
     * para que el usuario quede autenticado sin necesidad de hacer login adicional.</p>
     *
     * @param token token UUID de reactivación enviado por email al usuario.
     * @return tokens JWT de acceso y refresco listos para usar.
     * @throws com.vvu981.colivibackend.features.user.exception.InvalidTokenException
     *         si el token no existe o ya ha caducado.
     */
    AuthResponse reactivateAccount(String token);

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);
}
