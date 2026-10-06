package com.vvu981.colivibackend.features.report.domain.event;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;

import java.util.UUID;

public record ReportCreatedEvent(
        UUID reportId,
        UUID reporterId,
        ReportTargetType targetType,
        UUID targetId,
        ReportReason reason
) {
}

