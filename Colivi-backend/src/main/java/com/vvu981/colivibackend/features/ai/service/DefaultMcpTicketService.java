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
import java.util.concurrent.TimeUnit;

@Service
public class DefaultMcpTicketService implements McpTicketService {

    private static final Logger log = LoggerFactory.getLogger(DefaultMcpTicketService.class);
    private static final int TICKET_TIMEOUT_SECONDS = 5;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public DefaultMcpTicketService(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(TICKET_TIMEOUT_SECONDS))
                .build());
    }

    public DefaultMcpTicketService(ObjectMapper objectMapper, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    /**
     * Solicita un ticket efimero al servidor MCP de forma no bloqueante.
     * Usa sendAsync() para no ocupar el hilo de Tomcat durante la espera de red.
     * El .get(timeout) bloquea un Virtual Thread de Java 21 (barato), no un hilo de plataforma.
     */
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
                    .build();

            // sendAsync() no bloquea el hilo de Tomcat.
            // Con Spring Boot 3.2 + Java 21 Virtual Threads habilitados, .get(timeout)
            // bloquea un virtual thread (recurso barato), no un hilo de plataforma del pool.
            HttpResponse<String> response = httpClient
                    .sendAsync(ticketReq, HttpResponse.BodyHandlers.ofString())
                    .get(TICKET_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("ticket")) {
                    return root.get("ticket").asText();
                }
            } else {
                log.warn("El servidor MCP no expidio ticket de sesion (HTTP {})", response.statusCode());
            }
        } catch (Exception e) {
            log.debug("No se pudo obtener ticket efimero de autenticacion MCP: {}", e.getMessage());
        }
        return null;
    }
}
