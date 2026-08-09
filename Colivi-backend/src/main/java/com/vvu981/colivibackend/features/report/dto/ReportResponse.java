package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        UUID reporterId,
        TargetType targetType,
        UUID targetId,
        ReportReason reason,
        String description,
        ReportStatus status,
        String adminNotes,
        UUID resolverId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime resolvedAt
) {
}
