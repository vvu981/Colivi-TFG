package com.vvu981.colivibackend.features.home.service.formatter;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.Home;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.domain.event.HomeCreatedEvent;
import com.vvu981.colivibackend.features.user.domain.User;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class HomeCreatedActivityFormatter implements ActivityLogFormatter<HomeCreatedEvent> {

    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(HomeActivityEvent event) {
        return event instanceof HomeCreatedEvent;
    }

    @Override
    public ActivityLog format(HomeCreatedEvent event) {
        ActivityLog log = new ActivityLog();
        
        Home home = new Home();
        home.setId(event.homeId());
        log.setHome(home);
        
        User actor = new User();
        actor.setId(event.actorId());
        log.setActor(actor);
        
        log.setActivityType(event.activityType());
        log.setDescription("El hogar '" + event.homeName() + "' ha sido creado.");
        
        try {
            log.setMetadata(objectMapper.writeValueAsString(java.util.Map.of("homeName", event.homeName())));
        } catch (Exception e) {
            log.setMetadata("{}");
        }
        
        return log;
    }
}
