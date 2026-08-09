package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record BulkReportStatusUpdateRequest(
        @NotEmpty(message = "Se requiere al menos un ID de denuncia.")
        @Size(min = 1, max = 100, message = "Solo se permite procesar hasta 100 denuncias a la vez.")
        List<UUID> reportIds,
        
        @NotNull(message = "El estado es obligatorio.")
        ReportStatus status,
        
        @Size(max = 1000, message = "Las notas administrativas superan el límite de 1000 caracteres.")
        String adminNotes
) {
}
