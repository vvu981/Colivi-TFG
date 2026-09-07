package com.vvu981.colivibackend.features.messaging.controller;

import com.vvu981.colivibackend.core.security.JwtTokenProvider;
import com.vvu981.colivibackend.core.security.SecurityConfig;
import com.vvu981.colivibackend.core.security.UserPrincipal;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import com.vvu981.colivibackend.features.messaging.service.ConversationService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConversationController.class)
@Import(SecurityConfig.class)
@DisplayName("ConversationController WebMvc Tests")
class ConversationControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private ConversationService conversationService;

        @MockBean
        private MessageService messageService;

        @MockBean
        private JwtTokenProvider jwtTokenProvider;

        @MockBean
        private UserRepository userRepository;

        private User currentUser;
        private UUID currentUserId;
        private UUID conversationId;
        private UUID listingId;
        private ConversationSummaryDto summaryDto;

        @BeforeEach
        void setUp() {
                currentUserId = UUID.randomUUID();
                conversationId = UUID.randomUUID();
                listingId = UUID.randomUUID();

                currentUser = new User();
                currentUser.setId(currentUserId);
                currentUser.setEmail("user@colivi.com");
                currentUser.setPasswordHash("hashed_pw");
                currentUser.setRole(UserRole.USER);

                summaryDto = new ConversationSummaryDto(
                                conversationId,
                                listingId,
                                "Habitación luminosa",
                                "https://example.com/thumb.jpg",
                                BigDecimal.valueOf(450),
                                UUID.randomUUID(),
                                "Ana Host",
                                null,
                                null,
                                "CONSULTATION",
                                LocalDate.now(),
                                LocalDate.now().plusMonths(3),
                                "Hola mundo",
                                LocalDateTime.now(),
                                0,
                                false,
                                false,
                                false);
        }

        private UsernamePasswordAuthenticationToken buildAuth(User user) {
                UserPrincipal principal = UserPrincipal.create(user);
                return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        }

        @Test
        @DisplayName("POST /consultations -> 201 Created y retorna resumen")
        void startConsultation_shouldReturn201() throws Exception {
                User host = new User();
                host.setId(UUID.randomUUID());
                host.setFirstName("Host");

                com.vvu981.colivibackend.features.accommodation.domain.Accommodation accommodation = new com.vvu981.colivibackend.features.accommodation.domain.Accommodation();
                accommodation.setImages(Collections.emptyList());

                com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing listing = com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing
                                .builder()
                                .id(listingId)
                                .title("Habitación luminosa")
                                .pricePerMonth(BigDecimal.valueOf(450))
                                .accommodation(accommodation)
                                .host(host)
                                .build();

                Conversation mockConv = Conversation.builder()
                                .id(conversationId)
                                .tenant(currentUser)
                                .host(host)
                                .listing(listing)
                                .lastMessageAt(LocalDateTime.now())
                                .lastMessagePreview("Consulta iniciada")
                                .tenantUnreadCount(0)
                                .hostUnreadCount(0)
                                .archivedByHost(false)
                                .archivedByTenant(false)
                                .build();

                when(conversationService.getOrCreateConsultation(eq(currentUserId), eq(listingId)))
                                .thenReturn(mockConv);

                mockMvc.perform(post("/api/v1/conversations/consultations")
                                .with(authentication(buildAuth(currentUser)))
                                .with(csrf())
                                .param("listingId", listingId.toString()))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.conversationId").value(conversationId.toString()));
        }

        @Test
        @DisplayName("GET / -> 200 OK y página de conversaciones")
        void getInbox_shouldReturn200() throws Exception {
                when(conversationService.getInbox(eq(currentUserId), eq(false), any()))
                                .thenReturn(new PageImpl<>(List.of(summaryDto), PageRequest.of(0, 20), 1));

                mockMvc.perform(get("/api/v1/conversations")
                                .with(authentication(buildAuth(currentUser)))
                                .param("archived", "false")
                                .param("page", "0")
                                .param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].conversationId").value(conversationId.toString()))
                                .andExpect(jsonPath("$.content[0].listingTitle").value("Habitación luminosa"));
        }

        @Test
        @DisplayName("GET /{id} -> 200 OK y detalle de la conversación")
        void getConversationDetail_shouldReturn200() throws Exception {
                when(conversationService.getConversationSummary(conversationId, currentUserId))
                                .thenReturn(summaryDto);

                mockMvc.perform(get("/api/v1/conversations/{id}", conversationId)
                                .with(authentication(buildAuth(currentUser))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.conversationId").value(conversationId.toString()))
                                .andExpect(jsonPath("$.listingPricePerMonth").value(450));
        }

        @Test
        @DisplayName("PATCH /{id}/archive -> 204 No Content")
        void archiveConversation_shouldReturn204() throws Exception {
                doNothing().when(conversationService).archiveConversation(conversationId, currentUserId, true);

                mockMvc.perform(patch("/api/v1/conversations/{id}/archive", conversationId)
                                .with(authentication(buildAuth(currentUser)))
                                .with(csrf())
                                .param("archived", "true"))
                                .andExpect(status().isNoContent());

                verify(conversationService).archiveConversation(conversationId, currentUserId, true);
        }

        @Test
        @DisplayName("PATCH /{id}/read-receipt -> 204 No Content")
        void markAsRead_shouldReturn204() throws Exception {
                doNothing().when(messageService).markConversationAsRead(conversationId, currentUserId);

                mockMvc.perform(patch("/api/v1/conversations/{id}/read-receipt", conversationId)
                                .with(authentication(buildAuth(currentUser)))
                                .with(csrf()))
                                .andExpect(status().isNoContent());

                verify(messageService).markConversationAsRead(conversationId, currentUserId);
        }
}
