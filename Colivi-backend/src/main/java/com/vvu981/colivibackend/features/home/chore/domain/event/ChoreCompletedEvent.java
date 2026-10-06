package com.vvu981.colivibackend.features.home.chore.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;

import java.util.UUID;

public record ChoreCompletedEvent(
        UUID homeId,
        UUID actorId,
        UUID choreId,
        String title,
        int pointsEarned
) implements HomeActivityEvent {

    @Override
    public ActivityType activityType() {
        return ActivityType.CHORE_COMPLETED;
    }
}
