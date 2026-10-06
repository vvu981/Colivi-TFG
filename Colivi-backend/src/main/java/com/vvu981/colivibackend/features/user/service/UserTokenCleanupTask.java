package com.vvu981.colivibackend.features.user.service;

import com.vvu981.colivibackend.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserTokenCleanupTask {

    private final UserRepository userRepository;

    /**
     * Limpia los tokens de reactivación y recuperación de contraseña caducados.
     * Se ejecuta todos los días a las 03:00 AM (UTC por defecto en la app).
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting scheduled cleanup of expired user tokens...");
        
        int cleanedReactivationTokens = userRepository.clearExpiredReactivationTokens();
        int cleanedPasswordResetTokens = userRepository.clearExpiredPasswordResetTokens();
        
        log.info("Finished token cleanup. Cleared {} reactivation tokens and {} password reset tokens.", 
                cleanedReactivationTokens, cleanedPasswordResetTokens);
    }
}
