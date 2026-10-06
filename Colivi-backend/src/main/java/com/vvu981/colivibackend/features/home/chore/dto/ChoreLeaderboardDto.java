package com.vvu981.colivibackend.features.home.chore.dto;

import java.time.LocalDate;
import java.util.List;

public record ChoreLeaderboardDto(
        String period,
        LocalDate startDate,
        LocalDate endDate,
        List<UserChoreScoreDto> scores
) {}
