package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.event.HomeActivityEvent;
import com.vvu981.colivibackend.features.home.repository.ActivityLogRepository;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityLogListener {

    private final ActivityLogRepository activityLogRepository;
    private final List<ActivityLogFormatter<?>> formatters;

    @SuppressWarnings("unchecked")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleHomeActivityEvent(HomeActivityEvent event) {
        log.debug("Processing activity event: {}", event.activityType());

        try {
            formatters.stream()
                    .filter(formatter -> formatter.supports(event))
                    .findFirst()
                    .ifPresentOrElse(
                            formatter -> {
                                @SuppressWarnings("rawtypes")
                                ActivityLogFormatter rawFormatter = formatter;
                                ActivityLog logEntity = rawFormatter.format(event);
                                activityLogRepository.save(logEntity);
                            },
                            () -> log.warn("No ActivityLogFormatter found for event type: {}",
                                    event.getClass().getSimpleName()));
        } catch (Exception e) {
            log.error("Failed to persist ActivityLog for event {}. " +
                    "This error is safely contained and won't rollback the main transaction.", 
                    event.activityType(), e);
        }
    }
}
