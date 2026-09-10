package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class DefaultMcpTicketService implements McpTicketService {

    private static final Logger log = LoggerFactory.getLogger(DefaultMcpTicketService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public DefaultMcpTicketService(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build());
    }

    public DefaultMcpTicketService(ObjectMapper objectMapper, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public String fetchTicket(String cleanMcpUrl, String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) {
            return null;
        }
        try {
            HttpRequest ticketReq = HttpRequest.newBuilder()
                    .uri(URI.create(cleanMcpUrl + "/auth/ticket"))
                    .header("Authorization", "Bearer " + jwtToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(ticketReq, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("ticket")) {
                    return root.get("ticket").asText();
                }
            } else {
                log.warn("El servidor MCP no expidió ticket de sesión (HTTP {})", response.statusCode());
            }
        } catch (Exception e) {
            log.debug("No se pudo obtener ticket efímero de autenticación MCP: {}", e.getMessage());
        }
        return null;
    }
}
