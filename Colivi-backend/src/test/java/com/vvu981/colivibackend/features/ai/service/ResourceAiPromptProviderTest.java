package com.vvu981.colivibackend.features.ai.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@DisplayName("ResourceAiPromptProvider: Pruebas unitarias de carga y renderizado de System Prompt")
class ResourceAiPromptProviderTest {

    @Test
    @DisplayName("Debe cargar y renderizar la plantilla real desde classpath correctamente")
    void createSystemMessage_RendersFromClasspathSuccessfully() {
        Resource promptResource = new ClassPathResource("prompts/copilot-system.prompt");
        ResourceAiPromptProvider provider = new ResourceAiPromptProvider(promptResource);
        provider.init();

        String format = "{\"type\":\"object\"}";
        Message message = provider.createSystemMessage(format);

        assertThat(message).isNotNull();
        assertThat(message.getMessageType()).isEqualTo(MessageType.SYSTEM);
        assertThat(message.getText()).contains("Today is ");
        assertThat(message.getText()).contains("{\"type\":\"object\"}");
        assertThat(message.getText()).doesNotContain("{{currentDate}}");
        assertThat(message.getText()).doesNotContain("{{format}}");
        assertThat(message.getText()).contains("'response' is NEVER a tool");
    }

    @Test
    @DisplayName("Debe manejar formato nulo sin lanzar NullPointerException")
    void createSystemMessage_HandlesNullFormat() {
        String template = "System instructions. Format: {{format}}. Date: {{currentDate}}";
        Resource resource = new ByteArrayResource(template.getBytes(StandardCharsets.UTF_8));
        ResourceAiPromptProvider provider = new ResourceAiPromptProvider(resource);

        Message message = provider.createSystemMessage(null);

        assertThat(message).isNotNull();
        assertThat(message.getText()).contains("System instructions. Format: . Date: ");
        assertThat(message.getText()).doesNotContain("{{format}}");
    }

    @Test
    @DisplayName("Debe lanzar IllegalStateException si ocurre un error de I/O al leer el recurso")
    void loadTemplate_ThrowsIllegalStateExceptionOnIoError() throws IOException {
        Resource resource = mock(Resource.class);
        when(resource.getDescription()).thenReturn("mock-resource");
        when(resource.getContentAsString(any())).thenThrow(new IOException("Simulated disk failure"));

        ResourceAiPromptProvider provider = new ResourceAiPromptProvider(resource);

        assertThatThrownBy(provider::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No se pudo inicializar la plantilla del System Prompt cognitivo");
    }

    @Test
    @DisplayName("Debe lanzar NullPointerException si el recurso inyectado es nulo")
    void constructor_ThrowsOnNullResource() {
        assertThatThrownBy(() -> new ResourceAiPromptProvider(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("El recurso promptResource no puede ser nulo");
    }
}
