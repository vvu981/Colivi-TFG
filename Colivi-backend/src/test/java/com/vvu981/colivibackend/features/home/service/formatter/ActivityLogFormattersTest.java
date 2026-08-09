package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActivityLogFormattersTest {

    private final UUID homeId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testHomeCreatedActivityFormatter() {
        HomeCreatedActivityFormatter formatter = new HomeCreatedActivityFormatter(objectMapper);
        HomeCreatedEvent event = new HomeCreatedEvent(homeId, actorId, "My Home");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.HOME_CREATED, log.getActivityType());
        assertEquals("El hogar 'My Home' ha sido creado.", log.getDescription());
        assertEquals("{\"homeName\":\"My Home\"}", log.getMetadata());
        assertEquals(homeId, log.getHome().getId());
        assertEquals(actorId, log.getActor().getId());
    }

    @Test
    void testHomeDeletedActivityFormatter() {
        HomeDeletedActivityFormatter formatter = new HomeDeletedActivityFormatter(objectMapper);
        HomeDeletedEvent event = new HomeDeletedEvent(homeId, actorId, "My Home");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.HOME_DELETED, log.getActivityType());
        assertEquals("El hogar 'My Home' ha sido eliminado.", log.getDescription());
        assertEquals("{\"deletedHomeName\":\"My Home\"}", log.getMetadata());
    }

    @Test
    void testMemberJoinedActivityFormatter() {
        MemberJoinedActivityFormatter formatter = new MemberJoinedActivityFormatter(objectMapper);
        MemberJoinedEvent event = new MemberJoinedEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_JOINED, log.getActivityType());
        assertEquals("John Doe se ha unido al hogar.", log.getDescription());
        assertEquals("{\"joinedUser\":\"John Doe\"}", log.getMetadata());
    }

    @Test
    void testMemberLeftActivityFormatter() {
        MemberLeftActivityFormatter formatter = new MemberLeftActivityFormatter(objectMapper);
        MemberLeftEvent event = new MemberLeftEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_LEFT, log.getActivityType());
        assertEquals("John Doe ha abandonado el hogar.", log.getDescription());
        assertEquals("{\"leftUser\":\"John Doe\"}", log.getMetadata());
    }

    @Test
    void testMemberExpelledActivityFormatter() {
        MemberExpelledActivityFormatter formatter = new MemberExpelledActivityFormatter(objectMapper);
        MemberExpelledEvent event = new MemberExpelledEvent(homeId, actorId, "John Doe", "Bad behavior");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_EXPELLED, log.getActivityType());
        String meta1 = log.getMetadata();
        assertTrue(meta1.contains("\"reason\":\"Bad behavior\""));
        assertTrue(meta1.contains("\"expelledUser\":\"John Doe\""));
        
        MemberExpelledEvent eventNoReason = new MemberExpelledEvent(homeId, actorId, "John Doe", null);
        ActivityLog logNoReason = formatter.format(eventNoReason);
        String meta2 = logNoReason.getMetadata();
        assertTrue(meta2.contains("\"reason\":\"\""));
        assertTrue(meta2.contains("\"expelledUser\":\"John Doe\""));
    }

    @Test
    void testAdminTransferredActivityFormatter() {
        AdminTransferredActivityFormatter formatter = new AdminTransferredActivityFormatter(objectMapper);
        AdminTransferredEvent event = new AdminTransferredEvent(homeId, actorId, "Jane Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.ADMIN_TRANSFERRED, log.getActivityType());
        assertEquals("Se ha transferido el rol de administrador a Jane Doe.", log.getDescription());
        assertEquals("{\"newAdmin\":\"Jane Doe\"}", log.getMetadata());
    }

    @Test
    void testExpenseCreatedActivityFormatter() {
        ExpenseCreatedActivityFormatter formatter = new ExpenseCreatedActivityFormatter(objectMapper);
        ExpenseCreatedEvent event = new ExpenseCreatedEvent(homeId, actorId, "Internet Bill", new BigDecimal("50.00"));

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_CREATED, log.getActivityType());
        assertEquals("Se ha añadido un nuevo gasto: 'Internet Bill'.", log.getDescription());
        String meta3 = log.getMetadata();
        assertTrue(meta3.contains("\"expenseDescription\":\"Internet Bill\""));
        assertTrue(meta3.contains("\"amount\":\"50.00\""));
    }

    @Test
    void testExpenseDeletedActivityFormatter() {
        ExpenseDeletedActivityFormatter formatter = new ExpenseDeletedActivityFormatter(objectMapper);
        ExpenseDeletedEvent event = new ExpenseDeletedEvent(homeId, actorId, "Internet Bill");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_DELETED, log.getActivityType());
        assertEquals("Se ha eliminado el gasto: 'Internet Bill'.", log.getDescription());
        assertEquals("{\"deletedExpense\":\"Internet Bill\"}", log.getMetadata());
    }
}
