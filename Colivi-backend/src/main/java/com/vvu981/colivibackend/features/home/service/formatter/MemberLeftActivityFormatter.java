package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.domain.event.MemberLeftEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class MemberLeftActivityFormatter implements ActivityLogFormatter<MemberLeftEvent> {

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof MemberLeftEvent;
    }

    @Override
    public ActivityLog format(MemberLeftEvent event) {
        ActivityLog log = new ActivityLog();
        
        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);
        
        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);
        
        log.setActivityType(event.activityType());
        log.setDescription(event.userFullName() + " ha abandonado el hogar.");
        log.setMetadata("{\"leftUser\":\"" + event.userFullName() + "\"}");
        
        return log;
    }
}
