package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.*;
import com.vvu981.colivibackend.features.user.mapper.UserMapper;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor // Genera el constructor automáticamente inyectando los campos 'final'
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder; // Inyección directa de la herramienta
    private final UserMapper userMapper; // <-- Nuestra nueva herramienta

    // Centralizamos el tiempo de expiración (24 horas) para no tener 'magic numbers'
    private static final long ACCESS_TOKEN_EXPIRATION = 86400000L;

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
        String tokenLargo = request.refreshToken();

        if (!jwtTokenProvider.isTokenValid(tokenLargo)) {
            throw new RuntimeException("Error: Refresh token inválido o caducado");
        }

        String email = jwtTokenProvider.extractEmail(tokenLargo);

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado"));

        String nuevoAccessToken = jwtTokenProvider.generateAccessToken(user);

        return new AuthResponse(nuevoAccessToken, tokenLargo, ACCESS_TOKEN_EXPIRATION);
    }

    @Override
    public void setAdmin(UUID targetUserId) {
        User user = getActiveUserById(targetUserId);

        user.setRole(UserRole.ADMIN);

        userRepository.save(user);
    }

    @Override
    public UpdateNonSensible updateNonSensibleData(User currentUser, UpdateNonSensible updateData) {

        // 1. Delegamos la lógica de copiado. Se actualizan solo los campos enviados.
        userMapper.updateEntityFromDto(updateData, currentUser);

        // 2. Consolidamos en la base de datos.
        User savedUser = userRepository.save(currentUser);

        // 3. Empaquetamos la respuesta limpia y la devolvemos.
        return userMapper.toUpdateNonSensibleDto(savedUser);
    }

    @Override
    public void updateSensibleData(User currentUser, UpdateSensible updateSensible) {
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
        return userRepository.findByIdAndDeletedAtIsNull(userId).orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado"));
    }
}