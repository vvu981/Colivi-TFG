package com.vvu981.colivibackend.features.home.chore.service.formatter;

import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreCompletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreDeletedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreRescuedEvent;
import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreSeriesCreatedEvent;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeCreatedEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ChoreActivityLogFormattersTest {

    private final UUID homeId = UUID.randomUUID();
    private final UUID actorId = UUID.randomUUID();
    private final UUID choreId = UUID.randomUUID();

    @Test
    @DisplayName("ChoreCompletedActivityFormatter formats completed chore event correctly")
    void testChoreCompletedActivityFormatter() {
        ChoreCompletedActivityFormatter formatter = new ChoreCompletedActivityFormatter();
        ChoreCompletedEvent event = new ChoreCompletedEvent(homeId, actorId, choreId, "Limpiar cocina", 15);

        assertTrue(formatter.supports(event));
        assertFalse(formatter.supports(new HomeCreatedEvent(homeId, actorId, "Test Home")));

        ActivityLog log = formatter.format(event);

        assertNotNull(log);
        assertEquals(homeId, log.getHome().getId());
        assertEquals(actorId, log.getActor().getId());
        assertEquals(ActivityType.CHORE_COMPLETED, log.getActivityType());
        assertEquals("Se ha completado la tarea 'Limpiar cocina' (+15 pts).", log.getDescription());
        assertEquals(choreId.toString(), log.getMetadata().get("choreId"));
        assertEquals("Limpiar cocina", log.getMetadata().get("title"));
        assertEquals("15", log.getMetadata().get("pointsEarned"));
    }

    @Test
    @DisplayName("ChoreRescuedActivityFormatter formats rescued chore event correctly")
    void testChoreRescuedActivityFormatter() {
        ChoreRescuedActivityFormatter formatter = new ChoreRescuedActivityFormatter();
        UUID assigneeId = UUID.randomUUID();
        ChoreRescuedEvent event = new ChoreRescuedEvent(
                homeId,
                actorId,
                "Carlos",
                assigneeId,
                "Ana",
                choreId,
                "Sacar basura",
                20,
                10
        );

        assertTrue(formatter.supports(event));
        assertFalse(formatter.supports(new HomeCreatedEvent(homeId, actorId, "Test Home")));

        ActivityLog log = formatter.format(event);

        assertNotNull(log);
        assertEquals(homeId, log.getHome().getId());
        assertEquals(actorId, log.getActor().getId());
        assertEquals(ActivityType.CHORE_RESCUED, log.getActivityType());
        assertEquals("Carlos ha rescatado la tarea atrasada 'Sacar basura' (+20 pts). Ana pierde 10 pts.", log.getDescription());
        assertEquals(choreId.toString(), log.getMetadata().get("choreId"));
        assertEquals("Sacar basura", log.getMetadata().get("title"));
        assertEquals("Carlos", log.getMetadata().get("rescuerName"));
        assertEquals("Ana", log.getMetadata().get("assigneeName"));
        assertEquals("20", log.getMetadata().get("pointsGained"));
        assertEquals("10", log.getMetadata().get("pointsLost"));
    }

    @Test
    @DisplayName("ChoreDeletedActivityFormatter formats single and bulk chore deletion correctly")
    void testChoreDeletedActivityFormatter() {
        ChoreDeletedActivityFormatter formatter = new ChoreDeletedActivityFormatter();
        ChoreDeletedEvent event = new ChoreDeletedEvent(homeId, actorId, "Fregar platos", "DELETE_FORWARD", 4);

        assertTrue(formatter.supports(event));
        assertFalse(formatter.supports(new HomeCreatedEvent(homeId, actorId, "Test Home")));

        ActivityLog log = formatter.format(event);

        assertNotNull(log);
        assertEquals(homeId, log.getHome().getId());
        assertEquals(actorId, log.getActor().getId());
        assertEquals(ActivityType.CHORE_DELETED, log.getActivityType());
        assertEquals("Se ha eliminado la tarea 'Fregar platos' (modo: DELETE_FORWARD, 4 tarea(s) eliminada(s)).", log.getDescription());
        assertEquals("Fregar platos", log.getMetadata().get("title"));
        assertEquals("DELETE_FORWARD", log.getMetadata().get("deleteMode"));
        assertEquals("4", log.getMetadata().get("deletedCount"));
    }

    @Test
    @DisplayName("ChoreSeriesCreatedActivityFormatter formats chore series created event correctly")
    void testChoreSeriesCreatedActivityFormatter() {
        ChoreSeriesCreatedActivityFormatter formatter = new ChoreSeriesCreatedActivityFormatter();
        ChoreSeriesCreatedEvent event = new ChoreSeriesCreatedEvent(homeId, actorId, "Limpieza profunda", 12, 25);

        assertTrue(formatter.supports(event));
        assertFalse(formatter.supports(new HomeCreatedEvent(homeId, actorId, "Test Home")));

        ActivityLog log = formatter.format(event);

        assertNotNull(log);
        assertEquals(homeId, log.getHome().getId());
        assertEquals(actorId, log.getActor().getId());
        assertEquals(ActivityType.CHORE_SERIES_CREATED, log.getActivityType());
        assertEquals("Se ha creado una nueva serie de tareas: 'Limpieza profunda' (12 tareas, 25 pts c/u).", log.getDescription());
        assertEquals("Limpieza profunda", log.getMetadata().get("title"));
        assertEquals("12", log.getMetadata().get("count"));
        assertEquals("25", log.getMetadata().get("basePoints"));
    }
}
