package com.vvu981.colivibackend.features.user.domain.event;

import java.util.UUID;

public record UserDeletedEvent(UUID userId, boolean isHardDelete) {
}
