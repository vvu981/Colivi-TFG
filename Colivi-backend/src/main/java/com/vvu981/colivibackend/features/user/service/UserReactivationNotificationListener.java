package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.user.domain.UserReactivationRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserReactivationNotificationListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserReactivationRequested(UserReactivationRequestedEvent event) {
        log.info("Sending reactivation email to {} after transaction committed successfully.", event.email());
        emailService.sendReactivationEmail(event.email(), event.token());
    }
}
