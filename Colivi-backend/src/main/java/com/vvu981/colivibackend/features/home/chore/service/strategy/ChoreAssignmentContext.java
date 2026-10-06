package com.vvu981.colivibackend.features.home.chore.service.strategy;

import com.vvu981.colivibackend.features.home.chore.domain.ChoreSeries;
import com.vvu981.colivibackend.features.user.domain.User;

import java.time.LocalDate;
import java.util.List;

public record ChoreAssignmentContext(
        ChoreSeries series,
        List<User> orderedParticipants,
        int startIndex,
        int occurrenceIndex,
        LocalDate dueDate
) {}
