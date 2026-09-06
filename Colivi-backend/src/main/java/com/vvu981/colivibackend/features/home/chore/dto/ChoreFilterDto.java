package com.vvu981.colivibackend.features.home.chore.dto;

import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;

import java.time.LocalDate;
import java.util.UUID;

public record ChoreFilterDto(
        UUID assigneeId,
        ChoreStatus status,
        LocalDate from,
        LocalDate to,
        String period
) {}
