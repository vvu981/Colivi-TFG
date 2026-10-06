package com.vvu981.colivibackend.features.home.chore.service.formatter;

import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreRescuedEvent;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChoreRescuedActivityFormatter implements ActivityLogFormatter<ChoreRescuedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ChoreRescuedEvent;
    }

    @Override
    public ActivityLog format(ChoreRescuedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription(event.rescuerName() + " ha rescatado la tarea atrasada '" + event.title() +
                "' (+" + event.pointsGained() + " pts). " + event.assigneeName() + " pierde " + event.pointsLost() + " pts.");
        log.setMetadata(Map.of(
                "choreId", event.choreId().toString(),
                "title", event.title(),
                "rescuerName", event.rescuerName(),
                "assigneeName", event.assigneeName(),
                "pointsGained", String.valueOf(event.pointsGained()),
                "pointsLost", String.valueOf(event.pointsLost())
        ));

        return log;
    }
}
