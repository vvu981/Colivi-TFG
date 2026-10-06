package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.ExpenseDeletedEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class ExpenseDeletedActivityFormatter implements ActivityLogFormatter<ExpenseDeletedEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof ExpenseDeletedEvent;
    }

    @Override
    public ActivityLog format(ExpenseDeletedEvent event) {
        ActivityLog log = new ActivityLog();

        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);

        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);

        log.setActivityType(event.activityType());
        log.setDescription("Se ha eliminado el gasto: '" + event.expenseDescription() + "'.");

        log.setMetadata(java.util.Map.of("expenseDescription", event.expenseDescription()));

        return log;
    }
}
