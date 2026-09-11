package com.vvu981.colivibackend.features.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.features.ai.dto.AiChatMessageDto;
import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.spec.McpSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpringAiOrchestratorServiceImpl Unit Tests")
class SpringAiOrchestratorServiceImplTest {

    @Mock
    private OpenAiChatModel chatModel;

    @Mock
    private McpSyncClient mcpSyncClient;

    private ObjectMapper objectMapper;
    private McpTicketService mockTicketService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockTicketService = (cleanMcpUrl, jwtToken) -> "mock-ticket-123";
    }

    @Test
    @DisplayName("Debe procesar chat exitosamente descubriendo herramientas MCP y parseando respuesta limpia")
    void processChat_Success_WithTools() {
        McpSchema.Tool tool = new McpSchema.Tool(
                "search_coliving_listings",
                "Buscar colivings",
                "{\"type\":\"object\",\"properties\":{}}");
        McpSchema.ListToolsResult listToolsResult = new McpSchema.ListToolsResult(List.of(tool), null);
        when(mcpSyncClient.listTools()).thenReturn(listToolsResult);

        String jsonOutput = "{\"response\":\"Encontré 2 colivings en Madrid.\",\"draft\":null,\"toolsUsed\":[\"search_coliving_listings\"]}";
        Generation generation = new Generation(new AssistantMessage(jsonOutput));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001/",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest(
                "Busca colivings en Madrid",
                List.of(new AiChatMessageDto("user", "Hola")));

        AiChatResponse response = service.processChat(request, "mock-jwt-token");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEqualTo("Encontré 2 colivings en Madrid.");
        assertThat(response.draft()).isNull();
        verify(mcpSyncClient).initialize();
        verify(mcpSyncClient).close();
    }

    @Test
    @DisplayName("Debe limpiar bloques markdown ```json envolventes antes de parsear con BeanOutputConverter")
    void processChat_CleansMarkdownWrappers() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String rawMarkdownJson = "```json\n{\"response\":\"Respuesta markdown limpia.\",\"draft\":\"Borrador de prueba\"}\n```";
        Generation generation = new Generation(new AssistantMessage(rawMarkdownJson));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Consulta", null);
        AiChatResponse response = service.processChat(request, "valid-token");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEqualTo("Respuesta markdown limpia.");
        assertThat(response.draft()).isEqualTo("Borrador de prueba");
    }

    @Test
    @DisplayName("Debe extraer JSON correctamente aunque el LLM incluya texto conversacional antes y después (BUG-01)")
    void processChat_ExtractsJsonWithSurroundingConversationalText() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String rawLlmResponse = "Por supuesto, aquí tienes la información solicitada:\n" +
                "```json\n" +
                "{\"response\":\"Habitación disponible en Moncloa.\",\"draft\":null,\"toolsUsed\":[\"search_coliving_listings\"]}\n" +
                "```\n" +
                "¡Espero que te resulte útil!";
        Generation generation = new Generation(new AssistantMessage(rawLlmResponse));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Busco en Moncloa", null);
        AiChatResponse response = service.processChat(request, "valid-jwt");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEqualTo("Habitación disponible en Moncloa.");
        assertThat(response.toolsUsed()).containsExactly("search_coliving_listings");
    }

    @Test
    @DisplayName("Debe truncar el historial si supera el máximo de 6 mensajes preservando los últimos")
    void processChat_TruncatesHistory_WhenExceedsLimit() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String jsonOutput = "{\"response\":\"Historial procesado.\",\"draft\":null}";
        when(chatModel.call(any(Prompt.class)))
                .thenReturn(new ChatResponse(List.of(new Generation(new AssistantMessage(jsonOutput)))));

        List<AiChatMessageDto> history = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            history.add(new AiChatMessageDto(i % 2 == 0 ? "assistant" : "user", "Mensaje " + i));
        }

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Última pregunta", history);
        service.processChat(request, "jwt-token");

        verify(chatModel).call(promptCaptor.capture());
        Prompt prompt = promptCaptor.getValue();
        List<Message> messages = prompt.getInstructions();

        // 1 SystemMessage + 6 últimos mensajes del historial + 1 UserMessage actual = 8
        assertThat(messages).hasSize(8);
        assertThat(messages.get(1).getText()).isEqualTo("Mensaje 5");
        assertThat(messages.get(6).getText()).isEqualTo("Mensaje 10");
        assertThat(messages.get(7).getText()).isEqualTo("Última pregunta");
    }

    @Test
    @DisplayName("Debe ignorar roles de historial desconocidos y gestionar rawContent nulo defensivamente")
    void processChat_IgnoresUnknownRoles_AndHandlesNullOutput() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        // Output nulo
        Generation generation = new Generation(new AssistantMessage(""));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                null,
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        List<AiChatMessageDto> history = List.of(
                new AiChatMessageDto("system_custom", "Ignorar esto"),
                new AiChatMessageDto("user", "Pregunta válida"));

        AiChatRequest request = new AiChatRequest("Mensaje", history);
        AiChatResponse response = service.processChat(request, "mock-token");

        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("Debe manejar toolCallbacks nulos y respuesta con espacios en blanco devolviendo fallback")
    void processChat_NullToolCallbacks_AndBlankResponse() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        Generation generation = new Generation(new AssistantMessage("   "));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001/",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Consulta sin herramientas", null);
        AiChatResponse response = service.processChat(request, "valid-token");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEmpty();
    }

    @Test
    @DisplayName("Debe lanzar InvalidTokenException cuando el token JWT es nulo o está en blanco (BUG-04)")
    void processChat_NullOrBlankJwt_ThrowsInvalidTokenException() {
        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Consulta", null);

        assertThatThrownBy(() -> service.processChat(request, null))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("token de autenticación válido");

        assertThatThrownBy(() -> service.processChat(request, "   "))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("token de autenticación válido");
    }

    @Test
    @DisplayName("Debe preservar el texto conversacional íntegro cuando el LLM emite texto plano con llaves (BUG-03)")
    void processChat_NaturalLanguageWithBraces_PreservesFullText() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String textWithBraces = "Para filtrar alojamientos puedes emplear {precio_maximo} en tu consulta. ¿Deseas ver más detalles?";
        Generation generation = new Generation(new AssistantMessage(textWithBraces));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("¿Cómo filtro?", null);
        AiChatResponse response = service.processChat(request, "valid-token");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEqualTo(textWithBraces);
    }

    @Test
    @DisplayName("Debe lanzar excepción informativa cuando falla la obtención del ticket efímero (BUG-02)")
    void processChat_TicketFailure_ThrowsControlledException() {
        McpTicketService failingTicketService = (url, token) -> null;

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                failingTicketService);

        AiChatRequest request = new AiChatRequest("Hola", List.of());

        assertThatThrownBy(() -> service.processChat(request, "invalid-or-timeout-jwt"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No se pudo autenticar la sesión efímera con el servidor MCP");
    }

    @Test
    @DisplayName("Debe propagar InvalidTokenException directamente sin envolverla en AiOrchestratorException (BUG-02)")
    void processChat_InvalidTokenFromTicketService_PropagatesDirectly() {
        McpTicketService unauthorizedTicketService = (url, token) -> {
            throw new InvalidTokenException("Token de autenticación expirado o inválido ante el servidor MCP");
        };

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                unauthorizedTicketService);

        AiChatRequest request = new AiChatRequest("Consulta con token caducado", List.of());

        assertThatThrownBy(() -> service.processChat(request, "expired-jwt"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("Token de autenticación expirado o inválido");
    }

    @Test
    @DisplayName("Debe extraer JSON correctamente cuando el campo response contiene bloques de código markdown anidados (ROB-01)")
    void processChat_ExtractsJsonWithNestedMarkdownCodeBlock() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String jsonWithNestedMarkdown = "{\"response\":\"Para listar tus tareas usa este comando:\\n```bash\\ncurl http://localhost:8080/homes/1/chores\\n```\\n¡Listo!\",\"draft\":null,\"toolsUsed\":[]}";
        Generation generation = new Generation(new AssistantMessage(jsonWithNestedMarkdown));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("¿Cómo listo mis tareas por curl?", null);
        AiChatResponse response = service.processChat(request, "valid-jwt");

        assertThat(response).isNotNull();
        assertThat(response.response()).contains("```bash");
        assertThat(response.response()).contains("curl http://localhost:8080/homes/1/chores");
    }

    @Test
    @DisplayName("Debe capturar fallos de conexión al servidor MCP y lanzar RuntimeException informativa")
    void processChat_McpConnectionFailure_ThrowsInformativeException() {
        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:59999",
                "qwen/qwen3.8-27b",
                uri -> {
                    throw new RuntimeException("Connection refused on port 59999");
                },
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Hola", List.of());

        assertThatThrownBy(() -> service.processChat(request, "test-jwt"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Fallo en la comunicación con el asistente inteligente");
    }

    @Test
    @DisplayName("Debe instanciar correctamente SpringAiOrchestratorServiceImpl, DefaultMcpClientFactory y DefaultMcpTicketService")
    void constructor_InstantiatesCorrectly() {
        DefaultMcpClientFactory factory = new DefaultMcpClientFactory(objectMapper);
        assertThat(factory).isNotNull();

        var client = factory.createClient("http://localhost:3001/sse");
        assertThat(client).isNotNull();

        DefaultMcpTicketService ticketService = new DefaultMcpTicketService(objectMapper);
        assertThat(ticketService).isNotNull();

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                factory,
                ticketService);

        assertThat(service).isNotNull();
    }

    @Test
    @DisplayName("Debe aplicar fallback a texto libre sin fallar cuando el LLM devuelve una respuesta no-JSON (RES-01)")
    void processChat_NonJsonOutput_AppliesGracefulFallback() {
        when(mcpSyncClient.listTools()).thenReturn(new McpSchema.ListToolsResult(List.of(), null));

        String nonJsonFreeText = "¡Hola! Por supuesto, te puedo recomendar colivings en Madrid. No encontré pisos por debajo de 300€.";
        Generation generation = new Generation(new AssistantMessage(nonJsonFreeText));
        ChatResponse chatResponse = new ChatResponse(List.of(generation));
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);

        SpringAiOrchestratorServiceImpl service = new SpringAiOrchestratorServiceImpl(
                chatModel,
                "http://localhost:3001",
                "qwen/qwen3.8-27b",
                uri -> mcpSyncClient,
                mockTicketService);

        AiChatRequest request = new AiChatRequest("Busco piso barato", null);
        AiChatResponse response = service.processChat(request, "jwt-token");

        assertThat(response).isNotNull();
        assertThat(response.response()).isEqualTo(nonJsonFreeText);
        assertThat(response.draft()).isNull();
    }
}
