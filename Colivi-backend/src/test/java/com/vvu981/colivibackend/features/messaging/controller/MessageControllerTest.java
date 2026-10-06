package com.vvu981.colivibackend.features.messaging.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import com.vvu981.colivibackend.features.messaging.domain.MessageType;
import com.vvu981.colivibackend.features.messaging.dto.MessageResponseDto;
import com.vvu981.colivibackend.features.messaging.dto.SendMessageRequest;
import com.vvu981.colivibackend.features.messaging.service.MessageService;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.domain.UserRole;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MessageController.class)
@Import(SecurityConfig.class)
@DisplayName("MessageController WebMvc Tests")
class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MessageService messageService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private User currentUser;
    private UUID currentUserId;
    private UUID conversationId;
    private MessageResponseDto messageDto;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        currentUser = new User();
        currentUser.setId(currentUserId);
        currentUser.setEmail("victor@colivi.com");
        currentUser.setPasswordHash("hashed_pw");
        currentUser.setRole(UserRole.USER);

        messageDto = new MessageResponseDto(
                UUID.randomUUID(),
                conversationId,
                currentUserId,
                "Víctor",
                "Hola, ¿cuándo puedo entrar?",
                MessageType.USER_MESSAGE,
                MessageStatus.SENT,
                LocalDateTime.now(),
                null,
                true
        );
    }

    private UsernamePasswordAuthenticationToken buildAuth(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("GET / -> 200 OK y página de mensajes")
    void getMessages_shouldReturn200() throws Exception {
        when(messageService.getMessages(eq(conversationId), eq(currentUserId), any()))
                .thenReturn(new PageImpl<>(List.of(messageDto), PageRequest.of(0, 50), 1));

        mockMvc.perform(get("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .with(authentication(buildAuth(currentUser)))
                        .param("page", "0")
                        .param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(messageDto.id().toString()))
                .andExpect(jsonPath("$.content[0].content").value("Hola, ¿cuándo puedo entrar?"))
                .andExpect(jsonPath("$.content[0].isMine").value(true));
    }

    @Test
    @DisplayName("POST / con payload válido -> 201 Created y mensaje creado")
    void sendMessage_validPayload_shouldReturn201() throws Exception {
        SendMessageRequest request = new SendMessageRequest("Hola, ¿cuándo puedo entrar?");

        when(messageService.sendMessage(eq(conversationId), eq(currentUserId), any(SendMessageRequest.class)))
                .thenReturn(messageDto);

        mockMvc.perform(post("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .with(authentication(buildAuth(currentUser)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(messageDto.id().toString()))
                .andExpect(jsonPath("$.content").value("Hola, ¿cuándo puedo entrar?"));
    }

    @Test
    @DisplayName("POST / con contenido en blanco -> 400 Bad Request")
    void sendMessage_blankContent_shouldReturn400() throws Exception {
        SendMessageRequest request = new SendMessageRequest("   ");

        mockMvc.perform(post("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .with(authentication(buildAuth(currentUser)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
