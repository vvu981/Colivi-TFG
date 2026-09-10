package com.vvu981.colivibackend.features.ai.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * F-07: El bean RestClientCustomizer global fue eliminado para evitar que aplicara
 * timeouts a TODOS los RestClient del contexto Spring (no solo al de OpenAI).
 * La configuracion de timeout se delega a spring.ai.openai.* en application.properties.
 *
 * Este test verifica que AiClientConfig es instanciable y no produce errores.
 */
@DisplayName("AiClientConfig Unit Tests")
class AiClientConfigTest {

    @Test
    @DisplayName("AiClientConfig debe ser instanciable sin errores tras eliminar RestClientCustomizer global")
    void aiClientConfig_IsInstantiable() {
        AiClientConfig config = new AiClientConfig();
        assertThat(config).isNotNull();
    }
}
