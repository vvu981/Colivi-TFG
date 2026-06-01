package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.dto.AuthResponse;
import com.vvu981.colivibackend.features.user.dto.LoginRequest;
import com.vvu981.colivibackend.features.user.dto.RefreshTokenRequest;
import com.vvu981.colivibackend.features.user.dto.RegisterRequest;
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
        // 1. Le pedimos al archivador (base de datos) que busque a la persona
        User user = userRepository.findByIdAndDeletedAtIsNull(targetUserId)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado"));

        // 2. Usamos la goma de borrar virtual y le ponemos la etiqueta de jefe
        user.setRole(UserRole.ADMIN);

        // 3. Devolvemos la carpeta al archivador para que guarde los cambios
        userRepository.save(user);
    }
}