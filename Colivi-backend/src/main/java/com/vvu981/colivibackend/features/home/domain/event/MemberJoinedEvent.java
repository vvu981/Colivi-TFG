package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.util.UUID;

public record MemberJoinedEvent(
        UUID homeId,
        UUID actorId,
        String userFullName
) implements HomeActivityEvent {
    @Override
    public ActivityType activityType() {
        return ActivityType.MEMBER_JOINED;
    }

}
