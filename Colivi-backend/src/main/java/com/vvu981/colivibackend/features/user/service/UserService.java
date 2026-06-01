package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.dto.AuthResponse;
import com.vvu981.colivibackend.features.user.dto.LoginRequest;
import com.vvu981.colivibackend.features.user.dto.RefreshTokenRequest;
import com.vvu981.colivibackend.features.user.dto.RegisterRequest;

import java.util.UUID;

public interface UserService {

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse register(RegisterRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void setAdmin(UUID targetUserId);
}
