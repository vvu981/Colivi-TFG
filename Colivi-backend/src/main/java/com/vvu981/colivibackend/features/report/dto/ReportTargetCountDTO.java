package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportTargetType;

import java.util.UUID;

public record ReportTargetCountDTO(
        UUID targetId,
        ReportTargetType targetType,
        Long pendingCount,
        Long totalCount
) {
    public Long reportCount() {
        return pendingCount != null ? pendingCount : 0L;
    }
}
