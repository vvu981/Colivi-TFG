package com.vvu981.colivibackend.features.home.chore.dto;

import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
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

        @NotNull(message = "El usuario asignado es obligatorio")
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

        List<Integer> customDaysOfWeek
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
        this(title, description, assigneeId, basePoints, dueDate, recurrence, occurrences, null);
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
}
