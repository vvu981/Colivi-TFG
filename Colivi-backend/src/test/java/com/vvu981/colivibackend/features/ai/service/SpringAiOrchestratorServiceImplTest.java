package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.openai.OpenAiChatModel;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpringAiOrchestratorServiceImpl Unit Tests")
class SpringAiOrchestratorServiceImplTest {

    @Mock
    private OpenAiChatModel chatModel;

    @Test
    @DisplayName("Debe manejar fallos de conexión al servidor MCP gracefully lanzando RuntimeException informativa")
    void processChat_McpConnectionFailure_ThrowsInformativeException() {
        ObjectMapper objectMapper = new ObjectMapper();
        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                objectMapper,
                "http://localhost:59999", // Puerto inactivo para verificar resiliencia
                "llama-3.3-70b-versatile"
        );

        AiChatRequest request = new AiChatRequest("Hola", List.of());

        assertThatThrownBy(() -> service.processChat(request, "test-jwt"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Fallo en la comunicación con el asistente inteligente");
    }
}
