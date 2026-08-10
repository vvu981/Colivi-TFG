package com.vvu981.colivibackend.features.user.domain;

public record UserPasswordResetRequestedEvent(
        String email,
        String token
) {
}
