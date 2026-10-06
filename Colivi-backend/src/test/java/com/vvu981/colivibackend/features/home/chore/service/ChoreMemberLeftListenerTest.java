package com.vvu981.colivibackend.features.home.chore.service;

import com.vvu981.colivibackend.features.home.domain.event.UserLeftHomeEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChoreMemberLeftListenerTest {

    @Mock
    private ChoreRotationService choreRotationService;

    @InjectMocks
    private ChoreMemberLeftListener listener;

    @Test
    @DisplayName("Debe delegar en choreRotationService al recibir UserLeftHomeEvent")
    void shouldDelegateToChoreRotationServiceWhenUserLeftHomeEventReceived() {
        UUID homeId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UserLeftHomeEvent event = new UserLeftHomeEvent(homeId, userId);

        listener.onUserLeftHome(event);

        verify(choreRotationService).handleUserLeftHome(homeId, userId);
    }
}
