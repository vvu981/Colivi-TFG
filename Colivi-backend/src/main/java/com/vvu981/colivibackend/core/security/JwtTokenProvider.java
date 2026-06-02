package com.vvu981.colivibackend.core.security;

import com.vvu981.colivibackend.features.user.domain.User;

public interface JwtTokenProvider {

    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    boolean isTokenValid(String token);

    String extractEmail(String token);

    Integer extractTokenVersion(String token);


}