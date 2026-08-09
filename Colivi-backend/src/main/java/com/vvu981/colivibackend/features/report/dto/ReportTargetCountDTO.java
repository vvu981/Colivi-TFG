package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.TargetType;

import java.util.UUID;

public record ReportTargetCountDTO(
        UUID targetId,
        TargetType targetType,
        Long reportCount
) {
}
