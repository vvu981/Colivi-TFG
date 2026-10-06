package com.vvu981.colivibackend.features.ai.service;

import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;

public interface AiOrchestratorService {
    AiChatResponse processChat(AiChatRequest request, String jwtToken);
}
