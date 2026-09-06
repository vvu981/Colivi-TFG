package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreLeaderboardDto;
import com.vvu981.colivibackend.features.home.chore.dto.UserChoreScoreDto;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Component
public class ChorePointCalculator {

    public record PeriodRange(LocalDate startDate, LocalDate endDate) {}

    public PeriodRange resolvePeriodRange(String period, LocalDate referenceDate) {
        LocalDate today = referenceDate != null ? referenceDate : LocalDate.now();
        if ("MONTHLY".equalsIgnoreCase(period)) {
            LocalDate start = today.withDayOfMonth(1);
            LocalDate end = today.withDayOfMonth(today.lengthOfMonth());
            return new PeriodRange(start, end);
        }
        // Default: WEEKLY
        LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        return new PeriodRange(start, end);
    }

    public ChoreLeaderboardDto calculateLeaderboard(
            String period,
            PeriodRange range,
            List<HomeMember> members,
            List<Chore> chores) {

        List<UserChoreScoreDto> scores = new ArrayList<>();

        for (HomeMember member : members) {
            User user = member.getUser();
            UUID userId = user.getId();

            int currentPoints = 0;
            int pendingPoints = 0;
            int completedCount = 0;
            int rescuedCount = 0;
            int penalizedCount = 0;
            int pendingCount = 0;

            for (Chore chore : chores) {
                boolean isCompleter = chore.getCompletedBy() != null && userId.equals(chore.getCompletedBy().getId());
                boolean isAssignee = chore.getAssignee() != null && userId.equals(chore.getAssignee().getId());

                if (chore.getStatus() == ChoreStatus.COMPLETED) {
                    if (isCompleter) {
                        currentPoints += chore.getBasePoints();
                        completedCount++;
                    }
                } else if (chore.getStatus() == ChoreStatus.LATE_COMPLETED) {
                    if (isCompleter && !isAssignee) {
                        // User rescued another member's chore
                        currentPoints += chore.getBasePoints();
                        rescuedCount++;
                    } else if (isCompleter && isAssignee) {
                        // User completed their own late chore before rescue
                        currentPoints += chore.getBasePoints();
                        completedCount++;
                    }

                    if (isAssignee && !isCompleter) {
                        // User was rescued by someone else -> penalty
                        currentPoints -= chore.getBasePoints();
                        penalizedCount++;
                    }
                } else if (chore.getStatus() == ChoreStatus.PENDING) {
                    if (isAssignee && chore.getDueDate() != null &&
                            !chore.getDueDate().isBefore(range.startDate()) &&
                            !chore.getDueDate().isAfter(range.endDate())) {
                        pendingPoints += chore.getBasePoints();
                        pendingCount++;
                    }
                }
            }

            int expectedPoints = currentPoints + pendingPoints;

            String fullName = user.getFullName();
            String displayName = (fullName != null && !fullName.isBlank()) ? fullName.trim() : user.getNickname();

            scores.add(new UserChoreScoreDto(
                    userId,
                    user.getNickname(),
                    displayName,
                    user.getProfilePicUrl(),
                    currentPoints,
                    expectedPoints,
                    completedCount,
                    rescuedCount,
                    penalizedCount,
                    pendingCount
            ));
        }

        // Sort by currentPoints DESC, then expectedPoints DESC, then nickname ASC
        scores.sort(Comparator
                .comparingInt(UserChoreScoreDto::currentPoints).reversed()
                .thenComparing(Comparator.comparingInt(UserChoreScoreDto::expectedPoints).reversed())
                .thenComparing(UserChoreScoreDto::nickname, String.CASE_INSENSITIVE_ORDER));

        String normalizedPeriod = "MONTHLY".equalsIgnoreCase(period) ? "MONTHLY" : "WEEKLY";
        return new ChoreLeaderboardDto(normalizedPeriod, range.startDate(), range.endDate(), scores);
    }
}
