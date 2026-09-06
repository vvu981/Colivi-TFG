package com.vvu981.colivibackend.features.home.chore.dto;

import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateChoreRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 150, message = "El título no puede exceder los 150 caracteres")
        String title,

        @Size(max = 1000, message = "La descripción no puede exceder los 1000 caracteres")
        String description,

        UUID assigneeId,

        @NotNull(message = "Los puntos base son obligatorios")
        @Min(value = 1, message = "Los puntos base deben ser al menos 1")
        @Max(value = 1000, message = "Los puntos base no pueden exceder 1000")
        Integer basePoints,

        @NotNull(message = "La fecha de vencimiento es obligatoria")
        LocalDate dueDate,

        RecurrenceType recurrence,

        @Min(value = 1, message = "El número de ocurrencias debe ser al menos 1")
        @Max(value = 60, message = "El número máximo de ocurrencias permitidas es 60")
        Integer occurrences,

        List<Integer> customDaysOfWeek,

        List<UUID> rotationUserIds,

        RotationType rotationType
) {
    public CreateChoreRequest(
            String title,
            String description,
            UUID assigneeId,
            Integer basePoints,
            LocalDate dueDate,
            RecurrenceType recurrence,
            Integer occurrences
    ) {
        this(title, description, assigneeId, basePoints, dueDate, recurrence, occurrences, null, null, RotationType.FIXED);
    }

    public CreateChoreRequest(
            String title,
            String description,
            UUID assigneeId,
            Integer basePoints,
            LocalDate dueDate,
            RecurrenceType recurrence,
            Integer occurrences,
            List<Integer> customDaysOfWeek
    ) {
        this(title, description, assigneeId, basePoints, dueDate, recurrence, occurrences, customDaysOfWeek, null, RotationType.FIXED);
    }

    public RecurrenceType getSafeRecurrence() {
        return recurrence != null ? recurrence : RecurrenceType.NONE;
    }

    public int getSafeOccurrences() {
        return (occurrences != null && occurrences > 0) ? occurrences : 1;
    }

    public List<Integer> getSafeCustomDaysOfWeek() {
        return customDaysOfWeek != null ? customDaysOfWeek : List.of();
    }

    public List<UUID> getSafeRotationUserIds() {
        return rotationUserIds != null ? rotationUserIds : List.of();
    }

    public RotationType getSafeRotationType() {
        if (rotationType != null) {
            return rotationType;
        }
        if (rotationUserIds != null && rotationUserIds.size() > 1) {
            return RotationType.ROUND_ROBIN;
        }
        return RotationType.FIXED;
    }
}
