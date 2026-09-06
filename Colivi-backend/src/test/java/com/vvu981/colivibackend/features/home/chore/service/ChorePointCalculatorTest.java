package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.chore.domain.Chore;
import com.vvu981.colivibackend.features.home.chore.domain.ChoreStatus;
import com.vvu981.colivibackend.features.home.chore.dto.ChoreLeaderboardDto;
import com.vvu981.colivibackend.features.home.chore.dto.UserChoreScoreDto;
import com.vvu981.colivibackend.features.home.domain.HomeMember;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChorePointCalculatorTest {

    private ChorePointCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new ChorePointCalculator();
    }

    @Test
    @DisplayName("resolvePeriodRange handles MONTHLY and WEEKLY with referenceDate and null")
    void testResolvePeriodRange() {
        LocalDate refDate = LocalDate.of(2026, 9, 15);

        // MONTHLY with refDate
        ChorePointCalculator.PeriodRange monthly = calculator.resolvePeriodRange("MONTHLY", refDate);
        assertEquals(LocalDate.of(2026, 9, 1), monthly.startDate());
        assertEquals(LocalDate.of(2026, 9, 30), monthly.endDate());

        // WEEKLY with refDate (2026-09-15 is a Tuesday)
        ChorePointCalculator.PeriodRange weekly = calculator.resolvePeriodRange("WEEKLY", refDate);
        assertEquals(LocalDate.of(2026, 9, 14), weekly.startDate()); // Monday
        assertEquals(LocalDate.of(2026, 9, 20), weekly.endDate());   // Sunday

        // Default with null period and null refDate
        ChorePointCalculator.PeriodRange defaultRange = calculator.resolvePeriodRange(null, null);
        assertNotNull(defaultRange.startDate());
        assertNotNull(defaultRange.endDate());
    }

    @Test
    @DisplayName("calculateLeaderboard processes COMPLETED, LATE_COMPLETED, PENDING, and edge statuses")
    void testCalculateLeaderboardScoring() {
        UUID user1Id = UUID.randomUUID();
        User user1 = new User();
        user1.setId(user1Id);
        user1.setNickname("alice");
        user1.setFirstName("Alice");
        user1.setLastName1("Wonderland");

        UUID user2Id = UUID.randomUUID();
        User user2 = new User();
        user2.setId(user2Id);
        user2.setNickname("bob");
        user2.setFirstName("Bob");
        user2.setLastName1(null); // null lastName1 branch

        UUID user3Id = UUID.randomUUID();
        User user3 = new User();
        user3.setId(user3Id);
        user3.setNickname("charlie");
        user3.setFirstName("");
        user3.setLastName1(""); // blank fullName branch -> fallback to nickname

        HomeMember member1 = new HomeMember();
        member1.setUser(user1);
        HomeMember member2 = new HomeMember();
        member2.setUser(user2);
        HomeMember member3 = new HomeMember();
        member3.setUser(user3);

        LocalDate startDate = LocalDate.of(2026, 9, 1);
        LocalDate endDate = LocalDate.of(2026, 9, 30);
        ChorePointCalculator.PeriodRange range = new ChorePointCalculator.PeriodRange(startDate, endDate);

        List<Chore> chores = new ArrayList<>();

        // Chore 1: On-time completed by user1 (assignee user1)
        Chore c1 = new Chore();
        c1.setStatus(ChoreStatus.COMPLETED);
        c1.setAssignee(user1);
        c1.setCompletedBy(user1);
        c1.setBasePoints(10);
        chores.add(c1);

        // Chore 2: Late completed by user1 rescuing user2
        Chore c2 = new Chore();
        c2.setStatus(ChoreStatus.LATE_COMPLETED);
        c2.setAssignee(user2);
        c2.setCompletedBy(user1); // rescuer
        c2.setBasePoints(15);
        chores.add(c2);

        // Chore 3: Late completed by user2 for user2's own chore before rescue
        Chore c3 = new Chore();
        c3.setStatus(ChoreStatus.LATE_COMPLETED);
        c3.setAssignee(user2);
        c3.setCompletedBy(user2);
        c3.setBasePoints(20);
        chores.add(c3);

        // Chore 4: Pending in range for user3
        Chore c4 = new Chore();
        c4.setStatus(ChoreStatus.PENDING);
        c4.setAssignee(user3);
        c4.setDueDate(LocalDate.of(2026, 9, 15));
        c4.setBasePoints(5);
        chores.add(c4);

        // Chore 5: Pending OUT of range for user3 (should not add pending points)
        Chore c5 = new Chore();
        c5.setStatus(ChoreStatus.PENDING);
        c5.setAssignee(user3);
        c5.setDueDate(LocalDate.of(2026, 10, 5));
        c5.setBasePoints(50);
        chores.add(c5);

        // Chore 6: Pending with null due date
        Chore c6 = new Chore();
        c6.setStatus(ChoreStatus.PENDING);
        c6.setAssignee(user3);
        c6.setDueDate(null);
        c6.setBasePoints(30);
        chores.add(c6);

        // Chore 7: Chore with null status and chore with null assignee/completer
        Chore c7 = new Chore();
        c7.setStatus(null);
        chores.add(c7);

        ChoreLeaderboardDto leaderboard = calculator.calculateLeaderboard("MONTHLY", range, List.of(member1, member2, member3), chores);

        assertEquals("MONTHLY", leaderboard.period());
        assertEquals(3, leaderboard.scores().size());

        // User 1: 10 (completed) + 15 (rescued) = 25 points, expected = 25
        UserChoreScoreDto score1 = leaderboard.scores().stream()
                .filter(s -> s.userId().equals(user1Id)).findFirst().orElseThrow();
        assertEquals(25, score1.currentPoints());
        assertEquals(25, score1.expectedPoints());
        assertEquals(1, score1.completedCount());
        assertEquals(1, score1.rescuedCount());
        assertEquals(0, score1.penalizedCount());
        assertEquals("Alice Wonderland", score1.fullName());

        // User 2: -15 (penalized) + 20 (self-late completed) = 5 points
        UserChoreScoreDto score2 = leaderboard.scores().stream()
                .filter(s -> s.userId().equals(user2Id)).findFirst().orElseThrow();
        assertEquals(5, score2.currentPoints());
        assertEquals(1, score2.penalizedCount());
        assertEquals(1, score2.completedCount());
        assertEquals("Bob", score2.fullName());

        // User 3: 0 current points, 5 pending points (expected = 5)
        UserChoreScoreDto score3 = leaderboard.scores().stream()
                .filter(s -> s.userId().equals(user3Id)).findFirst().orElseThrow();
        assertEquals(0, score3.currentPoints());
        assertEquals(5, score3.expectedPoints());
        assertEquals(1, score3.pendingCount());
        assertEquals("charlie", score3.fullName()); // fallback to nickname
    }

    @Test
    @DisplayName("calculateLeaderboard tie-breaking sorts by currentPoints DESC, then expectedPoints DESC, then nickname ASC")
    void testTieBreakingSort() {
        UUID u1Id = UUID.randomUUID();
        User u1 = new User();
        u1.setId(u1Id);
        u1.setNickname("Zara");
        u1.setFirstName("Zara");

        UUID u2Id = UUID.randomUUID();
        User u2 = new User();
        u2.setId(u2Id);
        u2.setNickname("Adam");
        u2.setFirstName("Adam");

        HomeMember m1 = new HomeMember();
        m1.setUser(u1);
        HomeMember m2 = new HomeMember();
        m2.setUser(u2);

        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(7);
        ChorePointCalculator.PeriodRange range = new ChorePointCalculator.PeriodRange(start, end);

        // Both have 0 current points and 0 pending points -> Adam should be first (alphabetical)
        ChoreLeaderboardDto dto = calculator.calculateLeaderboard("WEEKLY", range, List.of(m1, m2), List.of());

        assertEquals("Adam", dto.scores().get(0).nickname());
        assertEquals("Zara", dto.scores().get(1).nickname());
    }
}
