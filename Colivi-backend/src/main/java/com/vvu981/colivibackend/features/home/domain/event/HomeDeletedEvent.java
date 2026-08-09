package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.util.UUID;

public record HomeDeletedEvent(
        UUID homeId,
        UUID actorId,
        String homeName
) implements HomeActivityEvent {
    @Override
    public ActivityType activityType() {
        return ActivityType.HOME_DELETED;
    }

}
