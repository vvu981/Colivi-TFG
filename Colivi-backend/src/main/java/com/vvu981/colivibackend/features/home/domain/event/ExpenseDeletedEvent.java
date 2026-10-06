package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;
import java.util.UUID;

public record ExpenseDeletedEvent(
        UUID homeId,
        UUID actorId,
        String expenseDescription
) implements HomeActivityEvent {
    @Override
    public ActivityType activityType() {
        return ActivityType.EXPENSE_DELETED;
    }

}
