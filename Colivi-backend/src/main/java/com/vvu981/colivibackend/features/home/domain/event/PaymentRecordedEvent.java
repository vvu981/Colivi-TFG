package com.vvu981.colivibackend.features.home.domain.event;

import com.vvu981.colivibackend.features.home.domain.ActivityType;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentRecordedEvent(
        UUID homeId,
        UUID actorId,
        UUID payerId,
        UUID receiverId,
        String receiverName,
        BigDecimal amount,
        String notes
) implements HomeActivityEvent {

    @Override
    public ActivityType activityType() {
        return ActivityType.PAYMENT_RECORDED;
    }
}
