package com.vvu981.colivibackend.features.home.chore.domain;

import com.vvu981.colivibackend.features.home.domain.Home;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChoreSeriesTest {

    @Test
    @DisplayName("onCreate sets default values when fields are null")
    void testOnCreateDefaults() throws Exception {
        ChoreSeries series = new ChoreSeries();
        series.setBasePoints(null);
        series.setRecurrenceType(null);
        series.setOccurrences(null);
        series.setRotationType(null);
        series.setLastAssigneeIndex(null);
        series.setVersion(null);

        invokeOnCreate(series);

        assertNotNull(series.getCreatedAt());
        assertEquals(10, series.getBasePoints());
        assertEquals(RecurrenceType.NONE, series.getRecurrenceType());
        assertEquals(1, series.getOccurrences());
        assertEquals(RotationType.FIXED, series.getRotationType());
        assertEquals(0, series.getLastAssigneeIndex());
        assertEquals(0, series.getVersion());
    }

    @Test
    @DisplayName("onCreate preserves pre-existing values")
    void testOnCreatePreservesExistingValues() throws Exception {
        ChoreSeries series = new ChoreSeries();
        LocalDateTime existingCreated = LocalDateTime.now().minusDays(5);
        series.setCreatedAt(existingCreated);
        series.setBasePoints(25);
        series.setRecurrenceType(RecurrenceType.WEEKLY);
        series.setOccurrences(4);
        series.setRotationType(RotationType.ROUND_ROBIN);
        series.setLastAssigneeIndex(2);
        series.setVersion(1);

        invokeOnCreate(series);

        assertEquals(existingCreated, series.getCreatedAt());
        assertEquals(25, series.getBasePoints());
        assertEquals(RecurrenceType.WEEKLY, series.getRecurrenceType());
        assertEquals(4, series.getOccurrences());
        assertEquals(RotationType.ROUND_ROBIN, series.getRotationType());
        assertEquals(2, series.getLastAssigneeIndex());
        assertEquals(1, series.getVersion());
    }

    @Test
    @DisplayName("onUpdate sets updatedAt timestamp")
    void testOnUpdate() throws Exception {
        ChoreSeries series = new ChoreSeries();
        assertNull(series.getUpdatedAt());

        Method method = ChoreSeries.class.getDeclaredMethod("onUpdate");
        method.setAccessible(true);
        method.invoke(series);

        assertNotNull(series.getUpdatedAt());
    }

    @Test
    @DisplayName("addParticipant prevents nulls and duplicates")
    void testAddParticipant() {
        ChoreSeries series = new ChoreSeries();
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();

        series.addParticipant(null);
        assertTrue(series.getParticipantOrder().isEmpty());

        series.addParticipant(user1);
        assertEquals(1, series.getParticipantOrder().size());

        series.addParticipant(user1); // duplicate
        assertEquals(1, series.getParticipantOrder().size());

        series.addParticipant(user2);
        assertEquals(2, series.getParticipantOrder().size());
        assertEquals(List.of(user1, user2), series.getParticipantOrder());
    }

    @Test
    @DisplayName("removeParticipant handles null, empty, not found, and re-indexing")
    void testRemoveParticipant() {
        ChoreSeries series = new ChoreSeries();

        // Null userId
        assertFalse(series.removeParticipant(null));

        // Empty list
        UUID user1 = UUID.randomUUID();
        assertFalse(series.removeParticipant(user1));

        // User not in list
        UUID user2 = UUID.randomUUID();
        UUID user3 = UUID.randomUUID();
        series.setParticipantOrder(new ArrayList<>(List.of(user1, user2)));
        assertFalse(series.removeParticipant(user3));

        // Remove user when multiple exist and lastAssigneeIndex >= new size
        series.setParticipantOrder(new ArrayList<>(List.of(user1, user2, user3)));
        series.setLastAssigneeIndex(2);
        assertTrue(series.removeParticipant(user3));
        assertEquals(2, series.getParticipantOrder().size());
        assertEquals(0, series.getLastAssigneeIndex()); // reset because index was >= size

        // Remove until empty resets lastAssigneeIndex to 0
        series.setParticipantOrder(new ArrayList<>(List.of(user1)));
        series.setLastAssigneeIndex(0);
        assertTrue(series.removeParticipant(user1));
        assertTrue(series.getParticipantOrder().isEmpty());
        assertEquals(0, series.getLastAssigneeIndex());

        // Remove user where lastAssigneeIndex remains valid (< size)
        series.setParticipantOrder(new ArrayList<>(List.of(user1, user2, user3)));
        series.setLastAssigneeIndex(1);
        assertTrue(series.removeParticipant(user3));
        assertEquals(1, series.getLastAssigneeIndex()); // remains unchanged
    }

    @Test
    @DisplayName("hasParticipants returns expected boolean")
    void testHasParticipants() {
        ChoreSeries series = new ChoreSeries();
        assertFalse(series.hasParticipants());

        series.setParticipantOrder(null);
        assertFalse(series.hasParticipants());

        series.setParticipantOrder(new ArrayList<>(List.of(UUID.randomUUID())));
        assertTrue(series.hasParticipants());
    }

    @Test
    @DisplayName("AllArgsConstructor and getters/setters work properly")
    void testAllArgsConstructorAndAccessors() {
        UUID id = UUID.randomUUID();
        Home home = new Home();
        LocalDateTime now = LocalDateTime.now();
        List<UUID> participants = new ArrayList<>();

        ChoreSeries series = new ChoreSeries(
                id,
                home,
                "Title",
                "Description",
                15,
                RecurrenceType.WEEKLY,
                4,
                "1,3,5",
                RotationType.ROUND_ROBIN,
                1,
                participants,
                0,
                now,
                now
        );

        assertEquals(id, series.getId());
        assertEquals(home, series.getHome());
        assertEquals("Title", series.getTitle());
        assertEquals("Description", series.getDescription());
        assertEquals(15, series.getBasePoints());
        assertEquals(RecurrenceType.WEEKLY, series.getRecurrenceType());
        assertEquals(4, series.getOccurrences());
        assertEquals("1,3,5", series.getCustomDaysOfWeek());
        assertEquals(RotationType.ROUND_ROBIN, series.getRotationType());
        assertEquals(1, series.getLastAssigneeIndex());
        assertEquals(participants, series.getParticipantOrder());
        assertEquals(0, series.getVersion());
        assertEquals(now, series.getCreatedAt());
        assertEquals(now, series.getUpdatedAt());
    }

    private void invokeOnCreate(ChoreSeries series) throws Exception {
        Method method = ChoreSeries.class.getDeclaredMethod("onCreate");
        method.setAccessible(true);
        method.invoke(series);
    }
}
