package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.util.UUID;

public interface HomeActivityEvent {
    UUID homeId();
    UUID actorId();
    ActivityType activityType();
}
