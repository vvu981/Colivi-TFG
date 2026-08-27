package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.core.mail.service.EmailService;
import com.vvu981.colivibackend.features.user.domain.UserPasswordResetRequestedEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserPasswordResetNotificationListenerTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserPasswordResetNotificationListener listener;

    @Test
    @DisplayName("Debe delegar en emailService.sendPasswordResetEmail cuando se recibe el evento")
    void shouldSendEmailOnPasswordResetEvent() {
        UserPasswordResetRequestedEvent event = new UserPasswordResetRequestedEvent(
                "user@colivi.com",
                "reset-token-1234"
        );

        listener.onPasswordResetRequested(event);

        verify(emailService).sendPasswordResetEmail("user@colivi.com", "reset-token-1234");
    }
}
