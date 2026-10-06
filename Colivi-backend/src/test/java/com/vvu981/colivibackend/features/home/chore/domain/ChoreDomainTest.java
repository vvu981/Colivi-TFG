package com.vvu981.colivibackend.features.home.chore.domain;

import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChoreDomainTest {

    @Test
    @DisplayName("onCreate sets default values when fields are null")
    void testOnCreateDefaults() throws Exception {
        Chore chore = new Chore();
        chore.setStatus(null);
        chore.setBasePoints(null);

        invokeOnCreate(chore);

        assertNotNull(chore.getCreatedAt());
        assertEquals(ChoreStatus.PENDING, chore.getStatus());
        assertEquals(10, chore.getBasePoints());
    }

    @Test
    @DisplayName("onCreate preserves existing values")
    void testOnCreatePreservesExisting() throws Exception {
        Chore chore = new Chore();
        LocalDateTime created = LocalDateTime.now().minusDays(2);
        chore.setCreatedAt(created);
        chore.setStatus(ChoreStatus.COMPLETED);
        chore.setBasePoints(20);

        invokeOnCreate(chore);

        assertEquals(created, chore.getCreatedAt());
        assertEquals(ChoreStatus.COMPLETED, chore.getStatus());
        assertEquals(20, chore.getBasePoints());
    }

    @Test
    @DisplayName("isLate correctly compares dueDate with referenceDate")
    void testIsLate() {
        Chore chore = new Chore();
        LocalDate today = LocalDate.of(2026, 9, 6);

        // Null dueDate
        assertFalse(chore.isLate(today));

        // Null referenceDate
        chore.setDueDate(today.minusDays(1));
        assertFalse(chore.isLate(null));

        // Due date before referenceDate -> true
        chore.setDueDate(today.minusDays(1));
        assertTrue(chore.isLate(today));

        // Due date equal referenceDate -> false
        chore.setDueDate(today);
        assertFalse(chore.isLate(today));

        // Due date after referenceDate -> false
        chore.setDueDate(today.plusDays(1));
        assertFalse(chore.isLate(today));
    }

    @Test
    @DisplayName("isPending and isCompleted return expected statuses")
    void testStatusChecks() {
        Chore chore = new Chore();

        chore.setStatus(ChoreStatus.PENDING);
        assertTrue(chore.isPending());
        assertFalse(chore.isCompleted());

        chore.setStatus(ChoreStatus.COMPLETED);
        assertFalse(chore.isPending());
        assertTrue(chore.isCompleted());

        chore.setStatus(ChoreStatus.LATE_COMPLETED);
        assertFalse(chore.isPending());
        assertTrue(chore.isCompleted());

        chore.setStatus(null);
        assertFalse(chore.isPending());
        assertFalse(chore.isCompleted());
    }

    @Test
    @DisplayName("getSeriesId and setSeriesId handle nulls, updates and equality")
    void testSeriesIdAccessors() {
        Chore chore = new Chore();
        assertNull(chore.getSeriesId());

        UUID seriesId1 = UUID.randomUUID();
        chore.setSeriesId(seriesId1);
        assertNotNull(chore.getSeries());
        assertEquals(seriesId1, chore.getSeriesId());

        // Same seriesId -> no-op
        ChoreSeries originalSeries = chore.getSeries();
        chore.setSeriesId(seriesId1);
        assertSame(originalSeries, chore.getSeries());

        // Different seriesId -> updates series
        UUID seriesId2 = UUID.randomUUID();
        chore.setSeriesId(seriesId2);
        assertNotSame(originalSeries, chore.getSeries());
        assertEquals(seriesId2, chore.getSeriesId());

        // Null seriesId -> clears series
        chore.setSeriesId(null);
        assertNull(chore.getSeries());
        assertNull(chore.getSeriesId());
    }

    @Test
    @DisplayName("AllArgsConstructor and accessors work as expected")
    void testAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        ChoreSeries series = new ChoreSeries();
        Home home = new Home();
        User assignee = new User();
        User completer = new User();
        LocalDate due = LocalDate.now();
        LocalDateTime completedAt = LocalDateTime.now();
        LocalDateTime createdAt = LocalDateTime.now();

        Chore chore = new Chore(
                id,
                series,
                home,
                assignee,
                completer,
                "Clean",
                "Clean room",
                15,
                due,
                ChoreStatus.COMPLETED,
                completedAt,
                createdAt,
                0
        );

        assertEquals(id, chore.getId());
        assertEquals(series, chore.getSeries());
        assertEquals(home, chore.getHome());
        assertEquals(assignee, chore.getAssignee());
        assertEquals(completer, chore.getCompletedBy());
        assertEquals("Clean", chore.getTitle());
        assertEquals("Clean room", chore.getDescription());
        assertEquals(15, chore.getBasePoints());
        assertEquals(due, chore.getDueDate());
        assertEquals(ChoreStatus.COMPLETED, chore.getStatus());
        assertEquals(completedAt, chore.getCompletedAt());
        assertEquals(createdAt, chore.getCreatedAt());
        assertEquals(0, chore.getVersion());
    }

    private void invokeOnCreate(Chore chore) throws Exception {
        Method method = Chore.class.getDeclaredMethod("onCreate");
        method.setAccessible(true);
        method.invoke(chore);
    }
}
