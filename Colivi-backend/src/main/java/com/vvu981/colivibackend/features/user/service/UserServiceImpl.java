package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.auth.service.EmailService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.*;
import com.vvu981.colivibackend.features.user.exception.AccountAlreadyActiveException;
import com.vvu981.colivibackend.features.user.exception.InvalidReactivationTokenException;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import com.vvu981.colivibackend.features.user.exception.StaleSessionException;
import com.vvu981.colivibackend.features.user.exception.UserNotFoundException;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor // Genera el constructor automáticamente inyectando los campos 'final'
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder; // Inyección directa de la herramienta
    private final UserMapper userMapper; // <-- Nuestra nueva herramienta
    private final EmailService emailService; // Inyección por interfaz (DIP)

    // Centralizamos el tiempo de expiración (24 horas) para no tener 'magic numbers'
    private static final long ACCESS_TOKEN_EXPIRATION = 86400000L;

    // TTL del token de reactivación: 24 horas
    private static final long REACTIVATION_TOKEN_TTL_HOURS = 24L;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(loginRequest.email())
                .orElseThrow(() -> new RuntimeException("Error: Credenciales inválidas."));

        if (!passwordEncoder.matches(loginRequest.password(), user.getPasswordHash())) {
            throw new RuntimeException("Error: Credenciales inválidas.");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, ACCESS_TOKEN_EXPIRATION);
    }

    @Override
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.findByEmailAndDeletedAtIsNull(request.email()).isPresent()) {
            throw new RuntimeException("Error: El email ya está registrado");
        }

        if (userRepository.findByNicknameAndDeletedAtIsNull(request.nickname()).isPresent()) {
            throw new RuntimeException("Error: El apodo ya está en uso");
        }

        User newUser = new User();
        newUser.setEmail(request.email());
        newUser.setNickname(request.nickname());
        newUser.setFirstName(request.firstName());
        newUser.setLastName1(request.lastName1());
        newUser.setLastName2(request.lastName2());
        newUser.setPhone(request.phone());

        // Asignación obligatoria del rol para evitar caídas en base de datos
        newUser.setRole(UserRole.USER);

        newUser.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(newUser);

        String accessToken = jwtTokenProvider.generateAccessToken(savedUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser);

        return new AuthResponse(accessToken, refreshToken, ACCESS_TOKEN_EXPIRATION);
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String currentRefreshToken = request.refreshToken();

        if (!jwtTokenProvider.isTokenValid(currentRefreshToken)) {
            throw new InvalidTokenException("Error: Refresh token inválido o caducado.");
        }

        String email = jwtTokenProvider.extractEmail(currentRefreshToken);
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new UserNotFoundException("Error: Usuario no encontrado."));

        Integer tokenVersionInJwt = jwtTokenProvider.extractTokenVersion(currentRefreshToken);
        if (!user.getTokenVersion().equals(tokenVersionInJwt)) {
            throw new StaleSessionException("Error: La sesión ha expirado o ha sido invalidada de forma remota.");
        }

        // 4. Rotación del Refresh Token (RTR) para máxima seguridad
        String nuevoAccessToken = jwtTokenProvider.generateAccessToken(user);
        String nuevoRefreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(nuevoAccessToken, nuevoRefreshToken, ACCESS_TOKEN_EXPIRATION);
    }

    @Override
    public void setAdmin(UUID targetUserId) {
        User user = getActiveUserById(targetUserId);

        user.setRole(UserRole.ADMIN);

        userRepository.save(user);
    }

    @Override
    public UpdateNonSensible updateNonSensibleData(UUID userId, UpdateNonSensible updateData) {

        User currentUser = getActiveUserById(userId);

        // 1. Delegamos la lógica de copiado. Se actualizan solo los campos enviados.
        userMapper.updateEntityFromDto(updateData, currentUser);

        // 2. Consolidamos en la base de datos.
        User savedUser = userRepository.save(currentUser);

        // 3. Empaquetamos la respuesta limpia y la devolvemos.
        return userMapper.toUpdateNonSensibleDto(savedUser);
    }

    @Override
    public void updateSensibleData(UUID userId, UpdateSensible updateSensible) {

        User currentUser = getActiveUserById(userId);

        if (!passwordEncoder.matches(updateSensible.currentPassword(), currentUser.getPasswordHash()))
            throw new RuntimeException("Error: la contraseña es incorrecta");

        boolean isModified = false;

        if (updateSensible.newEmail() != null && !updateSensible.newEmail().isBlank()) {
            currentUser.setEmail(updateSensible.newEmail());
            isModified = true;
        }

        if (updateSensible.newPassword() != null && !updateSensible.newPassword().isBlank()) {
            String hashedNewPassword = passwordEncoder.encode(updateSensible.newPassword());
            currentUser.setPasswordHash(hashedNewPassword);
            isModified = true;
        }

        if (isModified) {
            userRepository.save(currentUser);
        }
    }

    private User getActiveUserById(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado"));
    }

    @Override
    public void deleteUserSoft(UUID userId) {
        User user = getActiveUserById(userId);

        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void deleteUserHard(UUID userId) {
        User user = getActiveUserById(userId);

        userRepository.delete(user);
    }

    @Override
    public void logout(UUID userId) {

        User user = getActiveUserById(userId);

        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    @Override
    public void banUser(UUID userId, String message, LocalDateTime bannedUntil) {
        User user = getActiveUserById(userId);

        user.setBannedAt(LocalDateTime.now());
        user.setBanReason(message);
        user.setBannedUntil(bannedUntil);
        userRepository.save(user);
    }

    @Override
    public void unbanUser(UUID userId) {
        User user = getActiveUserById(userId);

        user.setBannedAt(null);
        userRepository.save(user);
    }

    @Override
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = getActiveUserById(userId);

        return userMapper.toUserProfileDto(user);
    }

    @Override
    public UserProfileResponse getMyProfile(UUID userId) {
        User user = getActiveUserById(userId);

        return userMapper.toUserProfileDto(user);
    }

    // ─── Flujo de reactivación de cuenta ─────────────────────────────────────

    /**
     * {@inheritDoc}
     *
     * <p><strong>Decisión de seguridad:</strong> si el email no existe en la base
     * de datos, el método retorna sin lanzar excepción. Esto evita el ataque de
     * enumeración de usuarios (user enumeration attack), donde un atacante podría
     * descubrir qué emails están registrados por las diferencias de respuesta.</p>
     */
    @Override
    @Transactional
    public void requestReactivation(String email) {

        // Buscamos el usuario independientemente de si está eliminado o no.
        // findByEmailAndDeletedAtIsNull NO sirve aquí: necesitamos exactamente los eliminados.
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);

        // Silencio si no existe → anti user-enumeration
        if (userOptional.isEmpty()) {
            log.warn("Reactivation requested for unknown email: {}", email);
            return;
        }

        User user = userOptional.get();

        // Si la cuenta ya está activa, informamos al cliente con una excepción semántica.
        if (user.getDeletedAt() == null) {
            throw new AccountAlreadyActiveException(
                    "Error: La cuenta asociada a este email ya está activa. Inicia sesión normalmente.");
        }

        // Generamos un token UUID único y establecemos su TTL.
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(REACTIVATION_TOKEN_TTL_HOURS);

        user.setReactivationToken(token);
        user.setReactivationTokenExpiresAt(expiresAt);
        userRepository.save(user);

        // Delegamos el envío del correo al EmailService (DIP: dependemos de la abstracción).
        emailService.sendReactivationEmail(user.getEmail(), token);

        log.info("Reactivation email sent to {} (token expires at {})", email, expiresAt);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Tras reactivar la cuenta, el token se limpia para que no pueda reutilizarse
     * (tokens de un solo uso). El {@code tokenVersion} se incrementa para invalidar
     * cualquier sesión anterior que pudiera existir antes del soft-delete.</p>
     */
    @Override
    @Transactional
    public AuthResponse reactivateAccount(String token) {

        // 1. Buscamos al usuario por el token (sin filtrar por deletedAt intencionalmente).
        User user = userRepository.findByReactivationToken(token)
                .orElseThrow(() -> new InvalidReactivationTokenException(
                        "Error: El enlace de reactivación no es válido."));

        // 2. Comprobamos que el token no ha caducado.
        if (user.getReactivationTokenExpiresAt() == null
                || LocalDateTime.now().isAfter(user.getReactivationTokenExpiresAt())) {
            throw new InvalidReactivationTokenException(
                    "Error: El enlace de reactivación ha caducado. Solicita uno nuevo.");
        }

        // 3. Reactivamos la cuenta: limpiamos el soft-delete.
        user.setDeletedAt(null);

        // 4. Limpiamos el token para que sea de un solo uso (previene reutilización).
        user.setReactivationToken(null);
        user.setReactivationTokenExpiresAt(null);

        // 5. Incrementamos el tokenVersion para invalidar sesiones anteriores al borrado.
        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);

        log.info("Account reactivated for user {}", user.getEmail());

        // 6. Generamos y devolvemos tokens JWT para que el usuario quede autenticado
        //    directamente, sin necesidad de un login adicional.
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, ACCESS_TOKEN_EXPIRATION);
    }
}