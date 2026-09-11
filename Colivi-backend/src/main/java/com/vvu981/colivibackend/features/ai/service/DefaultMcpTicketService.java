package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
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
     * Solicita un ticket efimero al servidor MCP.
     * Con Spring Boot 3.2 y Java 21 Virtual Threads habilitados, HttpClient.send()
     * desmonta de forma no bloqueante el Virtual Thread durante el I/O sin bloquear hilos OS.
     */
    @Override
    public String fetchTicket(String cleanMcpUrl, String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) {
            return null;
        }
        try {
            HttpRequest ticketReq = HttpRequest.newBuilder()
                    .uri(URI.create(cleanMcpUrl + "/auth/ticket"))
                    .timeout(Duration.ofSeconds(TICKET_TIMEOUT_SECONDS))
                    .header("Authorization", "Bearer " + jwtToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(ticketReq, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("ticket")) {
                    return root.get("ticket").asText();
                }
            } else if (response.statusCode() == 401) {
                // BUG-02: El servidor MCP rechazó el token JWT por expirado o inválido.
                // Lanzar InvalidTokenException directamente para evitar enmascarar con 502
                // y prevenir que se dispare falsamente el Circuit Breaker de Resilience4j.
                log.warn("El servidor MCP rechazó la autenticación con HTTP 401 para {}", cleanMcpUrl);
                throw new InvalidTokenException("Token de autenticación expirado o inválido ante el servidor MCP");
            } else {
                log.warn("El servidor MCP no expidio ticket de sesion (HTTP {})", response.statusCode());
            }
        } catch (InvalidTokenException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Interrupcion al solicitar ticket efimero de autenticacion MCP en {}: {}", cleanMcpUrl, e.getMessage());
        } catch (Exception e) {
            log.warn("Error al solicitar ticket efimero de autenticacion MCP en {}: {}", cleanMcpUrl, e.getMessage());
        }
        return null;
    }
}
