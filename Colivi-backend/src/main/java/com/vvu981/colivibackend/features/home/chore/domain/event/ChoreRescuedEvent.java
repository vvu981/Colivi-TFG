package com.vvu981.colivibackend.features.home.chore.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;

import java.util.UUID;

public record ChoreRescuedEvent(
        UUID homeId,
        UUID rescuerId,
        String rescuerName,
        UUID originalAssigneeId,
        String assigneeName,
        UUID choreId,
        String title,
        int pointsGained,
        int pointsLost
) implements HomeActivityEvent {

    @Override
    public UUID actorId() {
        return rescuerId;
    }

    @Override
    public ActivityType activityType() {
        return ActivityType.CHORE_RESCUED;
    }
}
