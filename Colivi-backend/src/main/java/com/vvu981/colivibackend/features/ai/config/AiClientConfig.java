package com.vvu981.colivibackend.features.ai.config;

import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.Duration;

@Configuration
public class AiClientConfig {

    @Bean
    public RestClientCustomizer aiRestClientCustomizer() {
        return restClientBuilder -> {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(Duration.ofSeconds(30));
            factory.setReadTimeout(Duration.ofSeconds(60));
            restClientBuilder.requestFactory(factory);
        };
    }
}
