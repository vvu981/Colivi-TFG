package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.AdminTransferredEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class AdminTransferredActivityFormatter implements ActivityLogFormatter<AdminTransferredEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof AdminTransferredEvent;
    }

    @Override
    public ActivityLog format(AdminTransferredEvent event) {
        ActivityLog log = new ActivityLog();
        
        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);
        
        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);
        
        log.setActivityType(event.activityType());
        log.setDescription("Se ha transferido el rol de administrador a " + event.newAdminFullName() + ".");
        log.setMetadata("{\"newAdmin\":\"" + event.newAdminFullName() + "\"}");
        
        return log;
    }
}
