package com.vvu981.colivibackend.features.home.domain.event;

import java.util.UUID;

public record UserLeftHomeEvent(
        UUID homeId,
        UUID userId
) {}
