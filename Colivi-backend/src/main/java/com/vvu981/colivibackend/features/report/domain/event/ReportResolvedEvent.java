package com.vvu981.colivibackend.features.report.domain.event;

import com.vvu981.colivibackend.features.report.domain.TargetType;

import java.util.UUID;

public record ReportResolvedEvent(
        UUID reportId,
        TargetType targetType,
        UUID targetId,
        UUID resolverId,
        String adminNotes
) {
}
