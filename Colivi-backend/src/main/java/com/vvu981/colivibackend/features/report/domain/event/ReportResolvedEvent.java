package com.vvu981.colivibackend.features.report.domain.event;

import com.vvu981.colivibackend.features.report.domain.ReportTargetType;

import java.util.UUID;

public record ReportResolvedEvent(
        UUID reportId,
        ReportTargetType targetType,
        UUID targetId,
        UUID resolverId,
        String adminNotes
) {
}
