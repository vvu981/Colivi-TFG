package com.vvu981.colivibackend.features.ai.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracion del cliente HTTP para Spring AI / Groq.
 *
 * F-07: Se elimino el bean RestClientCustomizer global que aplicaba un timeout de 60s
 * a TODOS los RestClient del contexto Spring (no solo al de OpenAI), afectando
 * potencialmente a otros clientes HTTP ya existentes.
 *
 * El timeout de lectura para las llamadas a Groq se controla directamente
 * via las propiedades de Spring AI:
 *   spring.ai.openai.* (ya configurado en application.properties)
 *
 * F-08: Validacion temprana en startup para alertar de forma visible si la API Key no esta
 * configurada, evitando arranque silencioso que desemboque en un 401 en runtime.
 */
@Configuration
public class AiClientConfig {

    private static final Logger log = LoggerFactory.getLogger(AiClientConfig.class);

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    public AiClientConfig() {}

    public AiClientConfig(String apiKey) {
        this.apiKey = apiKey;
    }

    @PostConstruct
    public void validateApiKeyOnStartup() {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("placeholder")) {
            log.warn("[AI Configuration Warning] spring.ai.openai.api-key no está configurada o contiene un placeholder. " +
                    "Configura la variable de entorno AI_API_KEY o GROQ_API_KEY para habilitar el asistente inteligente.");
        } else {
            log.info("[AI Configuration] spring.ai.openai.api-key inicializada correctamente.");
        }
    }
}
