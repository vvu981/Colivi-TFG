package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportTargetType;

import java.util.UUID;

public record ReportTargetCountDTO(
        UUID targetId,
        ReportTargetType targetType,
        Long reportCount
) {
}
