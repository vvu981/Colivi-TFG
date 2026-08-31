package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportFeedbackResponse(
        UUID id,
        ReportTargetType targetType,
        ReportReason reason,
        LocalDateTime resolvedAt
) {
}
