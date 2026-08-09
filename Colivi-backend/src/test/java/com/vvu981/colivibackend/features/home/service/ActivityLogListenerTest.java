package com.vvu981.colivibackend.features.home.service;

import com.vvu981.colivibackend.features.home.domain.ActivityLog;
import com.vvu981.colivibackend.features.home.domain.ActivityType;
import com.vvu981.colivibackend.features.home.domain.event.HomeCreatedEvent;
import com.vvu981.colivibackend.features.home.repository.ActivityLogRepository;
import com.vvu981.colivibackend.features.home.service.formatter.ActivityLogFormatter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogListenerTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ActivityLogFormatter<HomeCreatedEvent> formatter;

    @Test
    void shouldSaveActivityLogOnEvent() {
        UUID homeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        HomeCreatedEvent event = new HomeCreatedEvent(homeId, actorId, "My Home");

        ActivityLog mockedLog = new ActivityLog();
        mockedLog.setActivityType(ActivityType.HOME_CREATED);

        when(formatter.supports(event)).thenReturn(true);
        when(formatter.format(event)).thenReturn(mockedLog);

        ActivityLogListener listener = new ActivityLogListener(activityLogRepository, List.of(formatter));

        listener.handleHomeActivityEvent(event);

        ArgumentCaptor<ActivityLog> logCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository, times(1)).save(logCaptor.capture());

        ActivityLog savedLog = logCaptor.getValue();
        assertEquals(ActivityType.HOME_CREATED, savedLog.getActivityType());
    }

    @Test
    void shouldNotThrowExceptionIfNoFormatterFound() {
        UUID homeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        HomeCreatedEvent event = new HomeCreatedEvent(homeId, actorId, "My Home");

        when(formatter.supports(event)).thenReturn(false);

        ActivityLogListener listener = new ActivityLogListener(activityLogRepository, List.of(formatter));

        listener.handleHomeActivityEvent(event);

        verify(activityLogRepository, never()).save(any(ActivityLog.class));
    }

    @Test
    void shouldThrowExceptionIfSaveFails() {
        UUID homeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        HomeCreatedEvent event = new HomeCreatedEvent(homeId, actorId, "My Home");

        ActivityLog mockedLog = new ActivityLog();

        when(formatter.supports(event)).thenReturn(true);
        when(formatter.format(event)).thenReturn(mockedLog);
        when(activityLogRepository.save(any(ActivityLog.class))).thenThrow(new RuntimeException("DB Error"));

        ActivityLogListener listener = new ActivityLogListener(activityLogRepository, List.of(formatter));

        assertDoesNotThrow(() -> {
            listener.handleHomeActivityEvent(event);
        });

        verify(activityLogRepository, times(1)).save(any(ActivityLog.class));
    }
}
