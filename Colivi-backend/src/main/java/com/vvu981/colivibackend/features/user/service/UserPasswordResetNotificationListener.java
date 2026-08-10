package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.user.domain.UserPasswordResetRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserPasswordResetNotificationListener {

    private final EmailService emailService;

    @Async
    @EventListener
    public void onPasswordResetRequested(UserPasswordResetRequestedEvent event) {
        log.info("Sending password reset email to: {}", event.email());
        emailService.sendPasswordResetEmail(event.email(), event.token());
    }
}
