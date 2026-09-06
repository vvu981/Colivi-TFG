package com.vvu981.colivibackend.features.home.chore.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;

import java.util.UUID;

public record ChoreSeriesCreatedEvent(
        UUID homeId,
        UUID actorId,
        String title,
        int count,
        int basePoints
) implements HomeActivityEvent {

    @Override
    public ActivityType activityType() {
        return ActivityType.CHORE_SERIES_CREATED;
    }
}
