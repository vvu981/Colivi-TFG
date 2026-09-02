package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import jakarta.validation.constraints.AssertTrue;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

public record ReportFilterCriteriaDto(
        UUID id,
        ReportStatus status,
        ReportTargetType targetType,
        UUID targetId,
        UUID reporterId,
        ReportReason reason,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        String query) {

    @AssertTrue(message = "La fecha 'from' debe ser anterior o igual a 'to'")
    public boolean isValidDateRange() {
        if (from != null && to != null) {
            return !from.isAfter(to);
        }
        return true;
    }
}
