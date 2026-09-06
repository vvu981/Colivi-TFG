package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.domain.event.UserLeftHomeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChoreMemberLeftListener {

    private final ChoreRotationService choreRotationService;

    @EventListener
    public void onUserLeftHome(UserLeftHomeEvent event) {
        log.info("Received UserLeftHomeEvent for homeId: {}, userId: {}", event.homeId(), event.userId());
        choreRotationService.handleUserLeftHome(event.homeId(), event.userId());
    }
}
