package com.vvu981.colivibackend.features.ai.config;

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
 * Si en el futuro se necesita ajustar el timeout de forma programatica,
 * crear un bean OpenAiApi con un RestClient dedicado usando RestClient.builder()
 * y no RestClientCustomizer (que es global).
 */
@Configuration
public class AiClientConfig {
    // Configuracion delegada a application.properties
    // spring.ai.openai.base-url y spring.ai.openai.api-key
}
