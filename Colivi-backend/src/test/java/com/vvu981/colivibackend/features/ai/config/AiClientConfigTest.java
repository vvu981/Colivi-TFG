package com.vvu981.colivibackend.features.ai.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AiClientConfig Unit Tests")
class AiClientConfigTest {

    @Test
    @DisplayName("Debe instanciar el bean RestClientCustomizer y configurar los timeouts sin errores")
    void aiRestClientCustomizer_ConfiguresFactory() {
        AiClientConfig config = new AiClientConfig();
        RestClientCustomizer customizer = config.aiRestClientCustomizer();

        assertThat(customizer).isNotNull();

        RestClient.Builder builder = RestClient.builder();
        customizer.customize(builder);
        RestClient client = builder.build();

        assertThat(client).isNotNull();
    }
}
