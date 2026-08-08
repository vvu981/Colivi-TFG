package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseCreatedEvent(
        UUID homeId,
        UUID actorId,
        String description,
        BigDecimal amount
) implements HomeActivityEvent {
    @Override
    public ActivityType activityType() {
        return ActivityType.EXPENSE_CREATED;
    }

}
