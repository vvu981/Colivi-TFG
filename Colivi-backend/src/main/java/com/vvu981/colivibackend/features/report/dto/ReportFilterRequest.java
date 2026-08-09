package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.TargetType;

import java.time.LocalDateTime;

public record ReportFilterRequest(
        ReportStatus status,
        TargetType targetType,
        ReportReason reason,
        LocalDateTime from,
        LocalDateTime to
) {
}
