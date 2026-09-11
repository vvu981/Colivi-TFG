package com.vvu981.colivibackend.features.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.ai.dto.AiChatMessageDto;
import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import com.vvu981.colivibackend.features.ai.service.AiOrchestratorService;
import com.vvu981.colivibackend.core.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AiChatController Unit Tests")
class AiChatControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AiOrchestratorService orchestratorService;

    @InjectMocks
    private AiChatController aiChatController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aiChatController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Debe procesar el mensaje con token Bearer y devolver 200 con la respuesta estructurada")
    void chat_Success() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Hola que tal",
                List.of(new AiChatMessageDto("user", "Hola"))
        );

        AiChatResponse response = new AiChatResponse(
                "Hola, soy el asistente de Colivi.",
                null,
                List.of()
        );

        when(orchestratorService.processChat(any(AiChatRequest.class), eq("valid-jwt-token")))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Bearer valid-jwt-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("Hola, soy el asistente de Colivi."))
                .andExpect(jsonPath("$.draft").doesNotExist());
    }

    @Test
    @DisplayName("Debe procesar un mensaje con borrador sugerido devolviendo el campo draft")
    void chat_WithDraft_Success() throws Exception {
        AiChatRequest request = new AiChatRequest(
                "Redacta un mensaje para Ana aceptando su estancia",
                List.of()
        );

        AiChatResponse response = new AiChatResponse(
                "He preparado este borrador para tu candidata.",
                "Hola Ana, he aceptado tu reserva para la habitación en Madrid.",
                List.of("summarize_host_inbox")
        );

        when(orchestratorService.processChat(any(AiChatRequest.class), eq("valid-jwt-token")))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Bearer valid-jwt-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("He preparado este borrador para tu candidata."))
                .andExpect(jsonPath("$.draft").value("Hola Ana, he aceptado tu reserva para la habitación en Madrid."))
                .andExpect(jsonPath("$.toolsUsed[0]").value("summarize_host_inbox"));
    }

    @Test
    @DisplayName("Debe rechazar con 400 Bad Request cuando el mensaje está en blanco")
    void chat_EmptyMessage_BadRequest() throws Exception {
        AiChatRequest request = new AiChatRequest("", List.of());

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.errors.message").value("El mensaje no puede estar vacío"));
    }

    @Test
    @DisplayName("Debe rechazar con 400 Bad Request cuando el mensaje supera 2000 caracteres (ARC-01)")
    void chat_MessageExceedsLimit_BadRequest() throws Exception {
        String longMessage = "a".repeat(2001);
        AiChatRequest request = new AiChatRequest(longMessage, List.of());

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.errors.message").value("El mensaje supera el límite de 2000 caracteres permitidos"));
    }

    @Test
    @DisplayName("Debe rechazar con 400 Bad Request cuando el historial supera 20 mensajes (ARC-01)")
    void chat_HistoryExceedsLimit_BadRequest() throws Exception {
        List<AiChatMessageDto> largeHistory = java.util.stream.IntStream.rangeClosed(1, 21)
                .mapToObj(i -> new AiChatMessageDto(i % 2 == 0 ? "assistant" : "user", "msg " + i))
                .toList();
        AiChatRequest request = new AiChatRequest("Consulta válida", largeHistory);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.errors.history").value("El historial de conversación supera el máximo de 20 mensajes permitidos"));
    }

    @Test
    @DisplayName("Debe rechazar con 401 Unauthorized cuando no se proporciona header Authorization (F-04)")
    void chat_WithoutAuthorizationHeader_Unauthorized() throws Exception {
        AiChatRequest request = new AiChatRequest("Consulta anónima", List.of());

        when(orchestratorService.processChat(any(AiChatRequest.class), isNull()))
                .thenThrow(new com.vvu981.colivibackend.features.user.exception.InvalidTokenException(
                        "Token de autenticación JWT ausente o con formato inválido"));

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Token de autenticación JWT ausente o con formato inválido"));
    }

    @Test
    @DisplayName("Debe rechazar con 401 Unauthorized cuando el header Authorization no empieza con Bearer (F-04)")
    void chat_WithNonBearerAuthorizationHeader_Unauthorized() throws Exception {
        AiChatRequest request = new AiChatRequest("Consulta", List.of());

        when(orchestratorService.processChat(any(AiChatRequest.class), isNull()))
                .thenThrow(new com.vvu981.colivibackend.features.user.exception.InvalidTokenException(
                        "Token de autenticación JWT ausente o con formato inválido"));

        mockMvc.perform(post("/api/v1/ai/chat")
                        .header("Authorization", "Basic dXNlcjpwYXNz")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Token de autenticación JWT ausente o con formato inválido"));
    }

    @Test
    @DisplayName("Debe responder 503 cuando el circuit breaker de aiChat se activa por degradacion del servicio (F-06)")
    void circuitBreakerFallback_ReturnsServiceUnavailable() {
        AiChatRequest request = new AiChatRequest("Consulta", List.of());
        var response = aiChatController.circuitBreakerFallback(request, null, new RuntimeException("Downstream timeout"));

        assertThat(response.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().response()).contains("no esta disponible temporalmente por degradacion");
    }
}
