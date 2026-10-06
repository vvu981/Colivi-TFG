package com.vvu981.colivibackend.features.ai.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Objects;

/**
 * Implementación de {@link AiPromptProvider} basada en recursos del classpath (SRP).
 * Carga y cachea la plantilla del System Prompt en memoria para evitar operaciones de I/O
 * redundantes por cada petición conversacional.
 */
@Component
public class ResourceAiPromptProvider implements AiPromptProvider {

    private static final Logger log = LoggerFactory.getLogger(ResourceAiPromptProvider.class);
    private static final String DATE_PLACEHOLDER = "{{currentDate}}";
    private static final String FORMAT_PLACEHOLDER = "{{format}}";
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Europe/Madrid");

    private final Resource promptResource;
    private volatile String cachedTemplate;

    public ResourceAiPromptProvider(
            @Value("${app.ai.prompts.system:classpath:/prompts/copilot-system.prompt}") Resource promptResource) {
        this.promptResource = Objects.requireNonNull(promptResource, "El recurso promptResource no puede ser nulo");
    }

    @PostConstruct
    public void init() {
        loadTemplate();
    }

    @Override
    public Message createSystemMessage(String outputFormat) {
        if (cachedTemplate == null) {
            loadTemplate();
        }

        String currentDate = ZonedDateTime.now(DEFAULT_ZONE).toString();
        String safeFormat = outputFormat != null ? outputFormat : "";

        String renderedPrompt = cachedTemplate
                .replace(DATE_PLACEHOLDER, currentDate)
                .replace(FORMAT_PLACEHOLDER, safeFormat);

        return new SystemMessage(renderedPrompt);
    }

    private synchronized void loadTemplate() {
        if (cachedTemplate != null) {
            return;
        }
        try {
            this.cachedTemplate = promptResource.getContentAsString(StandardCharsets.UTF_8);
            log.info("Plantilla de System Prompt cargada exitosamente desde {}", promptResource.getDescription());
        } catch (IOException e) {
            log.error("Error crítico al cargar la plantilla de System Prompt desde {}", promptResource.getDescription(), e);
            throw new IllegalStateException("No se pudo inicializar la plantilla del System Prompt cognitivo", e);
        }
    }
}
