package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class DefaultMcpClientFactory implements McpClientFactory {

    private final ObjectMapper objectMapper;
    private final long connectTimeoutSeconds;
    private final long requestTimeoutSeconds;

    @Autowired
    public DefaultMcpClientFactory(
            ObjectMapper objectMapper,
            @Value("${app.mcp.connect-timeout-seconds:10}") long connectTimeoutSeconds,
            @Value("${app.mcp.request-timeout-seconds:20}") long requestTimeoutSeconds) {
        this.objectMapper = objectMapper;
        this.connectTimeoutSeconds = connectTimeoutSeconds;
        this.requestTimeoutSeconds = requestTimeoutSeconds;
    }

    public DefaultMcpClientFactory(ObjectMapper objectMapper) {
        this(objectMapper, 10, 20);
    }

    @Override
    public McpSyncClient createClient(String sseBaseUri) {
        // F-06: Timeouts acotados y configurables para evitar retencion prolongada de conexiones
        HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds));
        HttpClientSseClientTransport transport = new HttpClientSseClientTransport(
                httpClientBuilder,
                sseBaseUri,
                objectMapper);
        return McpClient.sync(transport)
                .requestTimeout(Duration.ofSeconds(requestTimeoutSeconds))
                .build();
    }
}
