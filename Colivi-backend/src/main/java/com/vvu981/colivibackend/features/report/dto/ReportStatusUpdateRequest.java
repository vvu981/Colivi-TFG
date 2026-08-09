package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import jakarta.validation.constraints.NotNull;

public record ReportStatusUpdateRequest(
        @NotNull(message = "El estado es obligatorio")
        ReportStatus status,
        
        String adminNotes
) {
}
