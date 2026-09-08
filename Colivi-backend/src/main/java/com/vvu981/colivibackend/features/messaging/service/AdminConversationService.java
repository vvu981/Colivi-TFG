package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;

import java.util.UUID;

public interface AdminConversationService {
    AdminConversationDossierDto getConversationDossier(UUID conversationId);
}
