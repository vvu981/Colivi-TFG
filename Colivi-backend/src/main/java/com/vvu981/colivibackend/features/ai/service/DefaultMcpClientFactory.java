package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import org.springframework.stereotype.Component;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class DefaultMcpClientFactory implements McpClientFactory {

    private final ObjectMapper objectMapper;

    public DefaultMcpClientFactory(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public McpSyncClient createClient(String sseBaseUri) {
        HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30));
        HttpClientSseClientTransport transport = new HttpClientSseClientTransport(
                httpClientBuilder,
                sseBaseUri,
                objectMapper);
        return McpClient.sync(transport)
                .requestTimeout(Duration.ofSeconds(35))
                .build();
    }
}
