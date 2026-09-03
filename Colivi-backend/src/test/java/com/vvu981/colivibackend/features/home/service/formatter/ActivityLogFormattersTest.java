package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;
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
        assertEquals("My Home", log.getMetadata().get("homeName"));
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
        assertEquals("My Home", log.getMetadata().get("deletedHomeName"));
    }

    @Test
    void testMemberJoinedActivityFormatter() {
        MemberJoinedActivityFormatter formatter = new MemberJoinedActivityFormatter();
        MemberJoinedEvent event = new MemberJoinedEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_JOINED, log.getActivityType());
        assertEquals("John Doe se ha unido al hogar.", log.getDescription());
        assertEquals("John Doe", log.getMetadata().get("joinedUser"));
    }

    @Test
    void testMemberLeftActivityFormatter() {
        MemberLeftActivityFormatter formatter = new MemberLeftActivityFormatter();
        MemberLeftEvent event = new MemberLeftEvent(homeId, actorId, "John Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_LEFT, log.getActivityType());
        assertEquals("John Doe ha abandonado el hogar.", log.getDescription());
        assertEquals("John Doe", log.getMetadata().get("leftUser"));
    }

    @Test
    void testMemberExpelledActivityFormatter() {
        MemberExpelledActivityFormatter formatter = new MemberExpelledActivityFormatter();
        MemberExpelledEvent event = new MemberExpelledEvent(homeId, actorId, "John Doe", "Bad behavior");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.MEMBER_EXPELLED, log.getActivityType());
        Map<String, Object> meta1 = log.getMetadata();
        assertEquals("Bad behavior", meta1.get("reason"));
        assertEquals("John Doe", meta1.get("expelledUser"));

        MemberExpelledEvent eventNoReason = new MemberExpelledEvent(homeId, actorId, "John Doe", null);
        ActivityLog logNoReason = formatter.format(eventNoReason);
        Map<String, Object> meta2 = logNoReason.getMetadata();
        assertEquals("", meta2.get("reason"));
        assertEquals("John Doe", meta2.get("expelledUser"));
    }

    @Test
    void testAdminTransferredActivityFormatter() {
        AdminTransferredActivityFormatter formatter = new AdminTransferredActivityFormatter();
        AdminTransferredEvent event = new AdminTransferredEvent(homeId, actorId, "Jane Doe");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.ADMIN_TRANSFERRED, log.getActivityType());
        assertEquals("Se ha transferido el rol de administrador a Jane Doe.", log.getDescription());
        assertEquals("Jane Doe", log.getMetadata().get("newAdmin"));
    }

    @Test
    void testExpenseCreatedActivityFormatter() {
        ExpenseCreatedActivityFormatter formatter = new ExpenseCreatedActivityFormatter();
        ExpenseCreatedEvent event = new ExpenseCreatedEvent(homeId, actorId, "Internet Bill", new BigDecimal("50.00"));

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_CREATED, log.getActivityType());
        assertEquals("Se ha añadido un nuevo gasto: 'Internet Bill'.", log.getDescription());
        Map<String, Object> meta3 = log.getMetadata();
        assertEquals("Internet Bill", meta3.get("expenseDescription"));
        assertEquals("50.00", meta3.get("amount"));
    }

    @Test
    void testExpenseDeletedActivityFormatter() {
        ExpenseDeletedActivityFormatter formatter = new ExpenseDeletedActivityFormatter();
        ExpenseDeletedEvent event = new ExpenseDeletedEvent(homeId, actorId, "Internet Bill");

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.EXPENSE_DELETED, log.getActivityType());
        assertEquals("Se ha eliminado el gasto: 'Internet Bill'.", log.getDescription());
        assertEquals("Internet Bill", log.getMetadata().get("expenseDescription"));
    }

    @Test
    void testPaymentRecordedActivityFormatter() {
        PaymentRecordedActivityFormatter formatter = new PaymentRecordedActivityFormatter();
        UUID payerId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();
        PaymentRecordedEvent event = new PaymentRecordedEvent(
                homeId,
                actorId,
                payerId,
                receiverId,
                "Bob",
                new BigDecimal("25.00"),
                "Bizum"
        );

        assertTrue(formatter.supports(event));

        ActivityLog log = formatter.format(event);
        assertEquals(ActivityType.PAYMENT_RECORDED, log.getActivityType());
        assertEquals("Ha registrado un pago de 25.00 € a Bob.", log.getDescription());
        assertEquals("Bob", log.getMetadata().get("receiverName"));
        assertEquals("25.00", log.getMetadata().get("amount"));
        assertEquals("Bizum", log.getMetadata().get("notes"));
    }
}
