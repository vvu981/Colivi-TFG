package com.vvu981.colivibackend.features.user.domain;

public record UserReactivationRequestedEvent(
        String email,
        String token
) {
}
