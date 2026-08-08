package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActivityLogFormattersTest {

    private final UUID homeId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();

    @Test
    void testHomeCreatedActivityFormatter() {
        HomeCreatedActivityFormatter formatter = new HomeCreatedActivityFormatter();
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
        HomeDeletedActivityFormatter formatter = new HomeDeletedActivityFormatter();
        HomeDeletedEvent event = new HomeDeletedEvent(homeId, actorId, "My Home");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.HOME_DELETED, log.getActivityType());
        assertEquals("El hogar 'My Home' ha sido eliminado.", log.getDescription());
        assertEquals("{\"deletedHomeName\":\"My Home\"}", log.getMetadata());
    }

    @Test
    void testMemberJoinedActivityFormatter() {
        MemberJoinedActivityFormatter formatter = new MemberJoinedActivityFormatter();
        MemberJoinedEvent event = new MemberJoinedEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_JOINED, log.getActivityType());
        assertEquals("John Doe se ha unido al hogar.", log.getDescription());
        assertEquals("{\"joinedUser\":\"John Doe\"}", log.getMetadata());
    }

    @Test
    void testMemberLeftActivityFormatter() {
        MemberLeftActivityFormatter formatter = new MemberLeftActivityFormatter();
        MemberLeftEvent event = new MemberLeftEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_LEFT, log.getActivityType());
        assertEquals("John Doe ha abandonado el hogar.", log.getDescription());
        assertEquals("{\"leftUser\":\"John Doe\"}", log.getMetadata());
    }

    @Test
    void testMemberExpelledActivityFormatter() {
        MemberExpelledActivityFormatter formatter = new MemberExpelledActivityFormatter();
        MemberExpelledEvent event = new MemberExpelledEvent(homeId, actorId, "John Doe", "Bad behavior");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_EXPELLED, log.getActivityType());
        assertEquals("John Doe ha sido expulsado del hogar.", log.getDescription());
        assertEquals("{\"expelledUser\":\"John Doe\", \"reason\":\"Bad behavior\"}", log.getMetadata());
        
        MemberExpelledEvent eventNoReason = new MemberExpelledEvent(homeId, actorId, "John Doe", null);
        ActivityLog logNoReason = formatter.format(eventNoReason);
        assertEquals("{\"expelledUser\":\"John Doe\", \"reason\":\"\"}", logNoReason.getMetadata());
    }

    @Test
    void testAdminTransferredActivityFormatter() {
        AdminTransferredActivityFormatter formatter = new AdminTransferredActivityFormatter();
        AdminTransferredEvent event = new AdminTransferredEvent(homeId, actorId, "Jane Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.ADMIN_TRANSFERRED, log.getActivityType());
        assertEquals("Se ha transferido el rol de administrador a Jane Doe.", log.getDescription());
        assertEquals("{\"newAdmin\":\"Jane Doe\"}", log.getMetadata());
    }

    @Test
    void testExpenseCreatedActivityFormatter() {
        ExpenseCreatedActivityFormatter formatter = new ExpenseCreatedActivityFormatter();
        ExpenseCreatedEvent event = new ExpenseCreatedEvent(homeId, actorId, "Internet Bill", new BigDecimal("50.00"));

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_CREATED, log.getActivityType());
        assertEquals("Se ha añadido un nuevo gasto: 'Internet Bill'.", log.getDescription());
        assertEquals("{\"expenseDescription\":\"Internet Bill\", \"amount\":\"50.00\"}", log.getMetadata());
    }

    @Test
    void testExpenseDeletedActivityFormatter() {
        ExpenseDeletedActivityFormatter formatter = new ExpenseDeletedActivityFormatter();
        ExpenseDeletedEvent event = new ExpenseDeletedEvent(homeId, actorId, "Internet Bill");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_DELETED, log.getActivityType());
        assertEquals("Se ha eliminado el gasto: 'Internet Bill'.", log.getDescription());
        assertEquals("{\"deletedExpense\":\"Internet Bill\"}", log.getMetadata());
    }
}
