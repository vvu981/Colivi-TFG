package com.vvu981.colivibackend.features.home.chore.service.formatter;

import com.vvu981.colivibackend.features.home.chore.domain.event.ChoreSeriesCreatedEvent;
import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChoreSeriesCreatedActivityFormatter implements ActivityLogFormatter<ChoreSeriesCreatedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ChoreSeriesCreatedEvent;
    }

    @Override
    public ActivityLog format(ChoreSeriesCreatedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription("Se ha creado una nueva serie de tareas: '" + event.title() + "' (" + event.count() + " tareas, " + event.basePoints() + " pts c/u).");
        log.setMetadata(Map.of(
                "title", event.title(),
                "count", String.valueOf(event.count()),
                "basePoints", String.valueOf(event.basePoints())
        ));

        return log;
    }
}
