package com.vvu981.colivibackend.features.home.chore.service.formatter;

import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreDeletedEvent;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChoreDeletedActivityFormatter implements ActivityLogFormatter<ChoreDeletedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ChoreDeletedEvent;
    }

    @Override
    public ActivityLog format(ChoreDeletedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription("Se ha eliminado la tarea '" + event.title() + "' (modo: " + event.deleteMode() +
                ", " + event.deletedCount() + " tarea(s) eliminada(s)).");
        log.setMetadata(Map.of(
                "title", event.title(),
                "deleteMode", event.deleteMode(),
                "deletedCount", String.valueOf(event.deletedCount())
        ));

        return log;
    }
}
