package com.vvu981.colivibackend.features.home.chore.dto;

import com.vvu981.colivibackend.features.home.chore.domain.RecurrenceType;
import com.vvu981.colivibackend.features.home.chore.domain.RotationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateChoreRequestTest {

    @Test
    @DisplayName("getSafeRecurrence returns recurrence or default NONE")
    void testGetSafeRecurrence() {
        CreateChoreRequest reqWithRecurrence = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), RecurrenceType.WEEKLY, 2
        );
        assertEquals(RecurrenceType.WEEKLY, reqWithRecurrence.getSafeRecurrence());

        CreateChoreRequest reqNullRecurrence = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), null, 2
        );
        assertEquals(RecurrenceType.NONE, reqNullRecurrence.getSafeRecurrence());
    }

    @Test
    @DisplayName("getSafeOccurrences handles null, zero, negative, and positive values")
    void testGetSafeOccurrences() {
        CreateChoreRequest reqNull = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), null, null
        );
        assertEquals(1, reqNull.getSafeOccurrences());

        CreateChoreRequest reqZero = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), null, 0
        );
        assertEquals(1, reqZero.getSafeOccurrences());

        CreateChoreRequest reqNegative = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), null, -5
        );
        assertEquals(1, reqNegative.getSafeOccurrences());

        CreateChoreRequest reqPositive = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), null, 5
        );
        assertEquals(5, reqPositive.getSafeOccurrences());
    }

    @Test
    @DisplayName("getSafeCustomDaysOfWeek returns list or empty list")
    void testGetSafeCustomDaysOfWeek() {
        CreateChoreRequest reqWithDays = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), RecurrenceType.CUSTOM, 3, List.of(1, 3, 5)
        );
        assertEquals(List.of(1, 3, 5), reqWithDays.getSafeCustomDaysOfWeek());

        CreateChoreRequest reqNullDays = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(), RecurrenceType.CUSTOM, 3, null
        );
        assertTrue(reqNullDays.getSafeCustomDaysOfWeek().isEmpty());
    }

    @Test
    @DisplayName("getSafeRotationUserIds returns user list or empty list")
    void testGetSafeRotationUserIds() {
        UUID u1 = UUID.randomUUID();
        CreateChoreRequest reqWithUsers = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, List.of(u1), RotationType.FIXED
        );
        assertEquals(List.of(u1), reqWithUsers.getSafeRotationUserIds());

        CreateChoreRequest reqNullUsers = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, null, RotationType.FIXED
        );
        assertTrue(reqNullUsers.getSafeRotationUserIds().isEmpty());
    }

    @Test
    @DisplayName("getSafeRotationType covers all explicit and inferred branches")
    void testGetSafeRotationType() {
        // Explicit rotationType provided
        CreateChoreRequest explicit = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, null, RotationType.ROUND_ROBIN
        );
        assertEquals(RotationType.ROUND_ROBIN, explicit.getSafeRotationType());

        // Inferred ROUND_ROBIN: rotationType null, but rotationUserIds > 1
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        CreateChoreRequest inferredRoundRobin = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, List.of(u1, u2), null
        );
        assertEquals(RotationType.ROUND_ROBIN, inferredRoundRobin.getSafeRotationType());

        // Inferred FIXED: rotationType null, rotationUserIds has only 1 element
        CreateChoreRequest singleUser = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, List.of(u1), null
        );
        assertEquals(RotationType.FIXED, singleUser.getSafeRotationType());

        // Inferred FIXED: rotationType null, rotationUserIds is empty
        CreateChoreRequest emptyUsers = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, Collections.emptyList(), null
        );
        assertEquals(RotationType.FIXED, emptyUsers.getSafeRotationType());

        // Inferred FIXED: rotationType null, rotationUserIds is null
        CreateChoreRequest nullUsers = new CreateChoreRequest(
                "Title", "Desc", UUID.randomUUID(), 10, LocalDate.now(),
                RecurrenceType.WEEKLY, 4, null, null, null
        );
        assertEquals(RotationType.FIXED, nullUsers.getSafeRotationType());
    }
}
