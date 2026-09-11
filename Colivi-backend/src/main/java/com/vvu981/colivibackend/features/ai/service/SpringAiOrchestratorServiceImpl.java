package com.vvu981.colivibackend.features.ai.service;

import com.vvu981.colivibackend.features.ai.dto.AiChatMessageDto;
import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import com.vvu981.colivibackend.features.ai.exception.AiOrchestratorException;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SpringAiOrchestratorServiceImpl implements AiOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(SpringAiOrchestratorServiceImpl.class);
    private static final int MAX_HISTORY_MESSAGES = 6;
    private static final Pattern MARKDOWN_BLOCK_PATTERN =
            Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)\\s*```", Pattern.DOTALL);

    private final OpenAiChatModel chatModel;
    private final String mcpBaseUrl;
    private final String groqModel;
    private final McpClientFactory mcpClientFactory;
    private final McpTicketService mcpTicketService;

    @Autowired
    public SpringAiOrchestratorServiceImpl(
            OpenAiChatModel chatModel,
            @Value("${app.mcp.url:http://localhost:3001}") String mcpBaseUrl,
            @Value("${spring.ai.openai.chat.options.model:qwen/qwen3.8-27b}") String groqModel,
            McpClientFactory mcpClientFactory,
            McpTicketService mcpTicketService) {
        this.chatModel = chatModel;
        this.mcpBaseUrl = mcpBaseUrl;
        this.groqModel = groqModel;
        this.mcpClientFactory = mcpClientFactory;
        this.mcpTicketService = mcpTicketService;
    }

    @Override
    public AiChatResponse processChat(AiChatRequest request, String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) {
            throw new InvalidTokenException("Se requiere un token de autenticación válido");
        }

        // Salvaguarda 3: Conexión efímera segura con timeout de 30s
        String cleanMcpUrl = mcpBaseUrl != null ? mcpBaseUrl.replaceAll("/+$", "") : "http://localhost:3001";

        // SEC-01 & BUG-02: Intercambio de ticket efimero de un solo uso con fallo controlado
        String ticket = mcpTicketService.fetchTicket(cleanMcpUrl, jwtToken);
        if (ticket == null) {
            log.error("Fallo al obtener ticket efimero de autenticacion para el servidor MCP en {}", cleanMcpUrl);
            throw new AiOrchestratorException("No se pudo autenticar la sesión efímera con el servidor MCP");
        }
        String sseBaseUri = cleanMcpUrl + "/ticket/" + ticket;

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
                    Today is """ + ZonedDateTime.now(ZoneId.of("Europe/Madrid"))
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
                    if (item.content() != null && !item.content().isBlank()) {
                        if ("user".equalsIgnoreCase(item.role())) {
                            messages.add(new UserMessage(item.content()));
                        } else if ("assistant".equalsIgnoreCase(item.role())) {
                            messages.add(new AssistantMessage(item.content()));
                        }
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

            // BUG-01: Extracción robusta de JSON multilínea tolerante a preámbulos y epílogos de LLMs
            String cleanContent = extractJsonPayload(rawContent);

            // RES-01 & BUG-03: Fallback defensivo ante respuestas en lenguaje natural preservando texto íntegro
            try {
                return outputConverter.convert(cleanContent);
            } catch (Exception ex) {
                log.warn("El LLM no devolvió un formato JSON estricto; aplicando fallback a texto plano: {}", cleanContent);
                String fallbackText = (rawContent != null && !rawContent.isBlank()) ? rawContent.trim() : cleanContent;
                return new AiChatResponse(fallbackText, null, List.of());
            }
        } catch (Exception e) {
            log.error("Error en la orquestacion cognitiva Spring AI / MCP", e);
            throw new AiOrchestratorException("Fallo en la comunicación con el asistente inteligente", e);
        }
    }

    protected String extractJsonPayload(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            return "{\"response\":\"\"}";
        }
        String trimmed = rawContent.trim();
        Matcher matcher = MARKDOWN_BLOCK_PATTERN.matcher(trimmed);
        if (matcher.find()) {
            String blockContent = matcher.group(1).trim();
            int firstBrace = blockContent.indexOf('{');
            int lastBrace = blockContent.lastIndexOf('}');
            if (firstBrace != -1 && lastBrace > firstBrace) {
                return blockContent.substring(firstBrace, lastBrace + 1).trim();
            }
            return blockContent;
        }

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1).trim();
        }

        return trimmed;
    }
}
