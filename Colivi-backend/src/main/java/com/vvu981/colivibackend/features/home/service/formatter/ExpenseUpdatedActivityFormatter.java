package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.ExpenseUpdatedEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ExpenseUpdatedActivityFormatter implements ActivityLogFormatter<ExpenseUpdatedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ExpenseUpdatedEvent;
    }

    @Override
    public ActivityLog format(ExpenseUpdatedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription("Se ha modificado el gasto: '" + event.description() + "'.");

        log.setMetadata(
                Map.of("expenseDescription", event.description(), "amount", event.amount().toString()));

        return log;
    }
}
