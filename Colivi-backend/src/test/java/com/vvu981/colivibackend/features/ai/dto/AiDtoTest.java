package com.vvu981.colivibackend.features.ai.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AI DTOs Unit Tests")
class AiDtoTest {

    @Test
    @DisplayName("AiChatMessageDto: debe instanciarse y validar getters y equals")
    void testAiChatMessageDto() {
        AiChatMessageDto dto1 = new AiChatMessageDto("user", "Hola");
        AiChatMessageDto dto2 = new AiChatMessageDto("user", "Hola");

        assertThat(dto1.role()).isEqualTo("user");
        assertThat(dto1.content()).isEqualTo("Hola");
        assertThat(dto1).isEqualTo(dto2);
        assertThat(dto1.hashCode()).isEqualTo(dto2.hashCode());
        assertThat(dto1.toString()).contains("user", "Hola");
    }

    @Test
    @DisplayName("AiChatRequest: debe instanciarse y validar getters y equals")
    void testAiChatRequest() {
        AiChatMessageDto msg = new AiChatMessageDto("assistant", "Hola!");
        AiChatRequest req1 = new AiChatRequest("¿Qué tal?", List.of(msg));
        AiChatRequest req2 = new AiChatRequest("¿Qué tal?", List.of(msg));

        assertThat(req1.message()).isEqualTo("¿Qué tal?");
        assertThat(req1.history()).containsExactly(msg);
        assertThat(req1).isEqualTo(req2);
        assertThat(req1.hashCode()).isEqualTo(req2.hashCode());
    }

    @Test
    @DisplayName("AiChatResponse: debe instanciarse y validar getters y equals")
    void testAiChatResponse() {
        AiChatResponse res1 = new AiChatResponse("Respuesta", "Borrador", List.of("tool1"));
        AiChatResponse res2 = new AiChatResponse("Respuesta", "Borrador", List.of("tool1"));

        assertThat(res1.response()).isEqualTo("Respuesta");
        assertThat(res1.draft()).isEqualTo("Borrador");
        assertThat(res1.toolsUsed()).containsExactly("tool1");
        assertThat(res1).isEqualTo(res2);
        assertThat(res1.hashCode()).isEqualTo(res2.hashCode());
    }
}
