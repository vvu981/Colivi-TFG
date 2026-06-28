package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.dto.*;

import java.time.LocalDateTime;
import java.util.UUID;

public interface UserService {

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse register(RegisterRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void setAdmin(UUID targetUserId);

    UpdateNonSensible updateNonSensibleData(UUID userId, UpdateNonSensible updateData);

    void updateSensibleData(UUID userId, UpdateSensible updateSensible);

    void deleteUserSoft(UUID userId);

    void deleteUserHard(UUID userId);

    void logout(UUID userId);

    void banUser(UUID userId, String message, LocalDateTime bannedUntil);

    void unbanUser(UUID userId);

    UserProfileResponse getUserProfile(UUID userId);

    UserProfileResponse getMyProfile(UUID userId);
}
