package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.*;

import java.util.UUID;

public interface UserService {

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse register(RegisterRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void setAdmin(UUID targetUserId);

    UpdateNonSensible updateNonSensibleData(User currentUser, UpdateNonSensible updateData);
}
