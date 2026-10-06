package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserTokenCleanupTaskTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserTokenCleanupTask userTokenCleanupTask;

    @Test
    @DisplayName("Debe ejecutar la limpieza de tokens de reactivación y reseteo de contraseña expirados")
    void shouldCleanupExpiredTokens() {
        when(userRepository.clearExpiredReactivationTokens()).thenReturn(3);
        when(userRepository.clearExpiredPasswordResetTokens()).thenReturn(5);

        userTokenCleanupTask.cleanupExpiredTokens();

        verify(userRepository).clearExpiredReactivationTokens();
        verify(userRepository).clearExpiredPasswordResetTokens();
    }
}
