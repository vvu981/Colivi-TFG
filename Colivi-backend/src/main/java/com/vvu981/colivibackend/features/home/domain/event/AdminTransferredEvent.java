package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.util.UUID;

public record AdminTransferredEvent(
        UUID homeId,
        UUID actorId,
        String newAdminFullName
) implements HomeActivityEvent {
    @Override
    public ActivityType activityType() {
        return ActivityType.ADMIN_TRANSFERRED;
    }

}
