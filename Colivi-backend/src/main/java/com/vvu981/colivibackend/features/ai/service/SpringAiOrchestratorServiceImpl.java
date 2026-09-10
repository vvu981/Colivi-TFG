package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.ai.dto.AiChatMessageDto;
import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import io.modelcontextprotocol.client.McpSyncClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.ResponseFormat;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SpringAiOrchestratorServiceImpl implements AiOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(SpringAiOrchestratorServiceImpl.class);
    private static final int MAX_HISTORY_MESSAGES = 6;

    private final OpenAiChatModel chatModel;
    private final ObjectMapper objectMapper;
    private final String mcpBaseUrl;
    private final String groqModel;
    private final McpClientFactory mcpClientFactory;

    public SpringAiOrchestratorServiceImpl(
            OpenAiChatModel chatModel,
            ObjectMapper objectMapper,
            @Value("${app.mcp.url:http://localhost:3001}") String mcpBaseUrl,
            @Value("${spring.ai.openai.chat.options.model:qwen/qwen3.8-27b}") String groqModel,
            McpClientFactory mcpClientFactory) {
        this.chatModel = chatModel;
        this.objectMapper = objectMapper;
        this.mcpBaseUrl = mcpBaseUrl;
        this.groqModel = groqModel;
        this.mcpClientFactory = mcpClientFactory;
    }

    @Override
    public AiChatResponse processChat(AiChatRequest request, String jwtToken) {
        // Salvaguarda 3: Conexión efímera segura con timeout de 30s
        String cleanMcpUrl = mcpBaseUrl != null ? mcpBaseUrl.replaceAll("/+$", "") : "http://localhost:3001";

        // SEC-01: Intercambio de ticket efímero de un solo uso para no exponer el token JWT en la ruta URL
        String ticket = (jwtToken != null && !jwtToken.isBlank()) ? fetchEphemeralTicket(cleanMcpUrl, jwtToken) : null;
        String sseBaseUri = ticket != null ? cleanMcpUrl + "/ticket/" + ticket : cleanMcpUrl;

        try (McpSyncClient mcpClient = mcpClientFactory.createClient(sseBaseUri)) {
            log.info("Inicializando transporte efímero MCP SSE contra {}", sseBaseUri);
            mcpClient.initialize();

            // Descubrimiento nativo de herramientas MCP con SyncMcpToolCallbackProvider
            SyncMcpToolCallbackProvider callbackProvider = new SyncMcpToolCallbackProvider(mcpClient);
            ToolCallback[] toolCallbacks = callbackProvider.getToolCallbacks();
            log.info("Herramientas MCP registradas en Spring AI: count={}",
                    toolCallbacks != null ? toolCallbacks.length : 0);

            BeanOutputConverter<AiChatResponse> outputConverter = new BeanOutputConverter<>(AiChatResponse.class);

            String systemPromptText = """
                    Today is """ + LocalDateTime.now()
                    + """
                            .
                            You are the intelligent copilot assistant for the Colivi coliving platform with access to read-only MCP tools.
                            Guidelines:
                            1. READ-ONLY: Never mutate data. Only consult information through tools.
                            2. HUMAN-IN-THE-LOOP: When asked to draft a message for a candidate or host, output the message strictly in the 'draft' field.
                            3. LANGUAGE: Communicate with the user in natural Spanish in the 'response' field.
                            4. OUTPUT FORMAT: You must return ONLY a raw JSON object. No markdown, no wrappers.
                            5. SCOPE OF CAPABILITIES: When asked about your capabilities, features, or what you can do, explain strictly and only the capabilities provided by your currently active tools and general conversational help. Never describe, mention, or assume administrative tools or capabilities (such as moderation queue or admin reports) unless an administrative tool is explicitly present in your active tools.
                            Conform strictly to this format:
                            """
                    + outputConverter.getFormat();

            List<Message> messages = new ArrayList<>();
            messages.add(new SystemMessage(systemPromptText));

            // Salvaguarda 2: Truncado de historial (máximo últimos 6 mensajes)
            if (request.history() != null && !request.history().isEmpty()) {
                int start = Math.max(0, request.history().size() - MAX_HISTORY_MESSAGES);
                List<AiChatMessageDto> truncated = request.history().subList(start, request.history().size());
                for (AiChatMessageDto item : truncated) {
                    if ("user".equalsIgnoreCase(item.role())) {
                        messages.add(new UserMessage(item.content()));
                    } else if ("assistant".equalsIgnoreCase(item.role())) {
                        messages.add(new AssistantMessage(item.content()));
                    }
                }
            }

            // Mensaje actual del usuario
            messages.add(new UserMessage(request.message()));

            // Groq prohíbe response_format: json_object en conjunto con tools (HTTP 400).
            // La restricción se impone mediante System Prompt y sanitización defensiva.
            OpenAiChatOptions.Builder optionsBuilder = OpenAiChatOptions.builder()
                    .model(groqModel)
                    .temperature(0.2)
                    .toolCallbacks(toolCallbacks);

            if (toolCallbacks == null || toolCallbacks.length == 0) {
                optionsBuilder.responseFormat(new ResponseFormat(ResponseFormat.Type.JSON_OBJECT, null));
            }

            OpenAiChatOptions options = optionsBuilder.build();

            Prompt prompt = new Prompt(messages, options);
            log.info("Invocando OpenAiChatModel con Groq ({})", groqModel);
            ChatResponse chatResponse = chatModel.call(prompt);

            String rawContent = chatResponse.getResult().getOutput().getText();
            log.debug("Contenido estructurado recibido de Groq: {}", rawContent);

            String cleanContent = (rawContent != null && !rawContent.isBlank()) ? rawContent.trim() : "{\"response\":\"\"}";
            if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
            }
            if (cleanContent.isBlank()) {
                cleanContent = "{\"response\":\"\"}";
            }

            // RES-01: Fallback defensivo ante respuestas en lenguaje natural no estructuradas en JSON
            try {
                return outputConverter.convert(cleanContent);
            } catch (Exception ex) {
                log.warn("El LLM no devolvió un formato JSON estricto; aplicando fallback a texto plano: {}", cleanContent);
                return new AiChatResponse(cleanContent, null, List.of());
            }
        } catch (Exception e) {
            log.error("Error en la orquestación cognitiva Spring AI / MCP", e);
            throw new RuntimeException("Fallo en la comunicación con el asistente inteligente: " + e.getMessage(), e);
        }
    }

    private String fetchEphemeralTicket(String cleanMcpUrl, String jwtToken) {
        try {
            HttpRequest ticketReq = HttpRequest.newBuilder()
                    .uri(URI.create(cleanMcpUrl + "/auth/ticket"))
                    .header("Authorization", "Bearer " + jwtToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(ticketReq, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response.body());
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
