package com.vvu981.colivibackend.features.home.chore.service.formatter;

import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreCompletedEvent;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChoreCompletedActivityFormatter implements ActivityLogFormatter<ChoreCompletedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ChoreCompletedEvent;
    }

    @Override
    public ActivityLog format(ChoreCompletedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription("Se ha completado la tarea '" + event.title() + "' a tiempo (+" + event.pointsEarned() + " pts).");
        log.setMetadata(Map.of(
                "choreId", event.choreId().toString(),
                "title", event.title(),
                "pointsEarned", String.valueOf(event.pointsEarned())
        ));

        return log;
    }
}
