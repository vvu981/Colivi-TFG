package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import jakarta.validation.constraints.NotNull;

public record ReportStatusUpdateRequest(
        @NotNull(message = "El estado es obligatorio")
        ReportStatus status,
        
        @jakarta.validation.constraints.Size(max = 1000, message = "Las notas administrativas no pueden superar los 1000 caracteres")
        String adminNotes
) {
}
