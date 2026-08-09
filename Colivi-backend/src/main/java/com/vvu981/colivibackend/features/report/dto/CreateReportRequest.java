package com.vvu981.colivibackend.features.report.dto;

import com.vvu981.colivibackend.features.report.domain.ReportReason;
import com.vvu981.colivibackend.features.report.domain.ReportTargetType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateReportRequest(
        @NotNull(message = "El tipo de objetivo es obligatorio")
        ReportTargetType targetType,

        @NotNull(message = "El ID del objetivo es obligatorio")
        UUID targetId,

        @NotNull(message = "El motivo de la denuncia es obligatorio")
        ReportReason reason,

        @jakarta.validation.constraints.Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres")
        String description
) {
}
