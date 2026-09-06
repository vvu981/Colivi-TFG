package com.vvu981.colivibackend.features.home.chore.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;

import java.util.UUID;

public record ChoreDeletedEvent(
        UUID homeId,
        UUID actorId,
        String title,
        String deleteMode,
        int deletedCount
) implements HomeActivityEvent {

    @Override
    public ActivityType activityType() {
        return ActivityType.CHORE_DELETED;
    }
}
