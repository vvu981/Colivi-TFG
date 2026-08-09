package com.vvu981.colivibackend.features.report.domain.event;

import com.vvu981.colivibackend.features.report.domain.TargetType;

import java.util.UUID;

public record ReportCreatedEvent(
        UUID reportId,
        UUID reporterId,
        TargetType targetType,
        UUID targetId
) {
}
