package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
import com.vvu981.colivibackend.features.bookingRequests.domain.BookingRequest;
import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import com.vvu981.colivibackend.features.messaging.domain.MessageType;
import com.vvu981.colivibackend.features.messaging.dto.MessageResponseDto;
import com.vvu981.colivibackend.features.messaging.dto.SendMessageRequest;
import com.vvu981.colivibackend.features.messaging.repository.ConversationRepository;
import com.vvu981.colivibackend.features.messaging.repository.MessageRepository;
import com.vvu981.colivibackend.features.messaging.service.validator.MessageAccessPolicyValidator;
import com.vvu981.colivibackend.features.user.domain.User;
import com.vvu981.colivibackend.features.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MessageServiceImpl Unit Tests")
class MessageServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageAccessPolicyValidator accessPolicyValidator;

    @InjectMocks
    private MessageServiceImpl messageService;

    private User tenant;
    private User host;
    private Conversation conversation;
    private UUID tenantId;
    private UUID hostId;
    private UUID conversationId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        hostId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        tenant = new User();
        tenant.setId(tenantId);
        tenant.setFirstName("Inquilino");
        tenant.setLastName1("Perez");
        tenant.setEmail("tenant@test.com");

        host = new User();
        host.setId(hostId);
        host.setFirstName("Anfitrión");
        host.setLastName1("Gómez");
        host.setEmail("host@test.com");

        conversation = Conversation.builder()
                .id(conversationId)
                .tenant(tenant)
                .host(host)
                .userMessageCount(0)
                .activeBookingRequest(null)
                .build();
    }

    @Nested
    @DisplayName("sendMessage tests")
    class SendMessageTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
        void whenConversationNotFound_thenThrowException() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            SendMessageRequest req = new SendMessageRequest("Hola");

            assertThatThrownBy(() -> messageService.sendMessage(conversationId, tenantId, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("Lanza ResourceNotFoundException si el usuario remitente no existe")
        void whenSenderNotFound_thenThrowException() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.empty());

            SendMessageRequest req = new SendMessageRequest("Hola");

            assertThatThrownBy(() -> messageService.sendMessage(conversationId, tenantId, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Usuario no encontrado");
        }

        @Test
        @DisplayName("Inquilino envía mensaje: incrementa unread de anfitrión y no dispara Nudge si count < 4")
        void whenTenantSendsMessage_thenIncrementHostUnread() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            doNothing().when(accessPolicyValidator).validateCanSendMessage(conversation, tenant);

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            SendMessageRequest req = new SendMessageRequest("Hola, ¿sigue disponible?");
            MessageResponseDto response = messageService.sendMessage(conversationId, tenantId, req);

            assertThat(response).isNotNull();
            assertThat(response.content()).isEqualTo("Hola, ¿sigue disponible?");
            assertThat(response.isMine()).isTrue();

            verify(conversationRepository).incrementHostUnreadAndSetLastMessage(eq(conversationId), anyString(), any());
            verify(conversationRepository, never()).claimNudgeAndSetLastMessage(any(), any(), any());
        }

        @Test
        @DisplayName("Anfitrión envía mensaje: incrementa unread de inquilino")
        void whenHostSendsMessage_thenIncrementTenantUnread() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(hostId)).thenReturn(Optional.of(host));
            doNothing().when(accessPolicyValidator).validateCanSendMessage(conversation, host);

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            SendMessageRequest req = new SendMessageRequest("Sí, sigue disponible para entrar en octubre.");
            MessageResponseDto response = messageService.sendMessage(conversationId, hostId, req);

            assertThat(response).isNotNull();
            assertThat(response.isMine()).isTrue();

            verify(conversationRepository).incrementTenantUnreadAndSetLastMessage(eq(conversationId), anyString(), any());
        }

        @Test
        @DisplayName("Alcanza umbral de 4 mensajes sin reserva: reclama el cerrojo de Nudge e inserta SYSTEM_MESSAGE")
        void whenThresholdReached_withoutBooking_andClaimed_thenInsertSystemNudge() {
            conversation.setUserMessageCount(3); // 3 + 1 = 4
            conversation.setActiveBookingRequest(null);

            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(conversationRepository.claimNudgeAndSetLastMessage(eq(conversationId), anyString(), any())).thenReturn(1);

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            SendMessageRequest req = new SendMessageRequest("¿Se puede visitar mañana?");
            MessageResponseDto response = messageService.sendMessage(conversationId, tenantId, req);

            assertThat(response).isNotNull();
            verify(conversationRepository).claimNudgeAndSetLastMessage(eq(conversationId), anyString(), any());
            // Se guardan dos mensajes: el del usuario y el system nudge
            verify(messageRepository, times(2)).saveAndFlush(any(Message.class));
        }

        @Test
        @DisplayName("Alcanza umbral de 4 mensajes pero ya fue reclamado por otra petición concurrente (claimed == 0)")
        void whenThresholdReached_andClaimFails_thenDoNotInsertSystemNudge() {
            conversation.setUserMessageCount(3);
            conversation.setActiveBookingRequest(null);

            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(conversationRepository.claimNudgeAndSetLastMessage(eq(conversationId), anyString(), any())).thenReturn(0);

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            SendMessageRequest req = new SendMessageRequest("¿Aceptas mascotas?");
            MessageResponseDto response = messageService.sendMessage(conversationId, tenantId, req);

            assertThat(response).isNotNull();
            verify(conversationRepository).claimNudgeAndSetLastMessage(eq(conversationId), anyString(), any());
            // Solo se guarda 1 mensaje (el del usuario)
            verify(messageRepository, times(1)).saveAndFlush(any(Message.class));
        }

        @Test
        @DisplayName("Alcanza umbral de 4 mensajes pero ya tiene reserva activa: no intenta disparar el Nudge")
        void whenThresholdReached_withActiveBooking_thenDoNotClaimNudge() {
            conversation.setUserMessageCount(5);
            conversation.setActiveBookingRequest(BookingRequest.builder().id(UUID.randomUUID()).build());

            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            SendMessageRequest req = new SendMessageRequest("Perfecto, gracias.");
            MessageResponseDto response = messageService.sendMessage(conversationId, tenantId, req);

            assertThat(response).isNotNull();
            verify(conversationRepository, never()).claimNudgeAndSetLastMessage(any(), any(), any());
            verify(messageRepository, times(1)).saveAndFlush(any(Message.class));
        }

        @Test
        @DisplayName("Trunca correctamente el preview del mensaje si supera los 140 caracteres")
        void whenMessageContentLong_thenTruncatePreview() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
            when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

            when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(inv -> {
                Message m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(LocalDateTime.now());
                return m;
            });

            String longContent = "A".repeat(150);
            SendMessageRequest req = new SendMessageRequest(longContent);
            messageService.sendMessage(conversationId, tenantId, req);

            String expectedPreview = "A".repeat(137) + "...";
            verify(conversationRepository).incrementHostUnreadAndSetLastMessage(eq(conversationId), eq(expectedPreview), any());
        }
    }

    @Nested
    @DisplayName("getMessages tests")
    class GetMessagesTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
        void whenConversationNotFound_thenThrowException() {
            Pageable pageable = PageRequest.of(0, 50);
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> messageService.getMessages(conversationId, tenantId, pageable))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("Valida acceso y retorna los mensajes paginados en orden")
        void whenConversationExists_thenReturnPagedMessages() {
            Pageable pageable = PageRequest.of(0, 50);
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            Message message = Message.builder()
                    .id(UUID.randomUUID())
                    .conversation(conversation)
                    .sender(tenant)
                    .content("Mensaje de prueba")
                    .messageType(MessageType.USER_MESSAGE)
                    .status(MessageStatus.SENT)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable))
                    .thenReturn(new PageImpl<>(List.of(message), pageable, 1));

            Page<MessageResponseDto> result = messageService.getMessages(conversationId, tenantId, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).content()).isEqualTo("Mensaje de prueba");
            assertThat(result.getContent().get(0).isMine()).isTrue();

            verify(accessPolicyValidator).validateCanAccessConversation(conversation, tenantId);
        }
    }

    @Nested
    @DisplayName("markConversationAsRead tests")
    class MarkConversationAsReadTests {

        @Test
        @DisplayName("Lanza ResourceNotFoundException si la conversación no existe")
        void whenConversationNotFound_thenThrowException() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> messageService.markConversationAsRead(conversationId, tenantId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversación no encontrada");
        }

        @Test
        @DisplayName("Inquilino lee la conversación: resetea tenantUnreadCount y marca mensajes entrantes como leídos")
        void whenTenantReads_thenResetTenantUnreadAndMarkIncoming() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            messageService.markConversationAsRead(conversationId, tenantId);

            verify(accessPolicyValidator).validateCanAccessConversation(conversation, tenantId);
            verify(conversationRepository).resetTenantUnreadCount(conversationId);
            verify(conversationRepository, never()).resetHostUnreadCount(any());
            verify(messageRepository).markIncomingMessagesAsRead(eq(conversationId), eq(tenantId), eq(MessageStatus.READ), any());
        }

        @Test
        @DisplayName("Anfitrión lee la conversación: resetea hostUnreadCount y marca mensajes entrantes como leídos")
        void whenHostReads_thenResetHostUnreadAndMarkIncoming() {
            when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

            messageService.markConversationAsRead(conversationId, hostId);

            verify(accessPolicyValidator).validateCanAccessConversation(conversation, hostId);
            verify(conversationRepository).resetHostUnreadCount(conversationId);
            verify(conversationRepository, never()).resetTenantUnreadCount(any());
            verify(messageRepository).markIncomingMessagesAsRead(eq(conversationId), eq(hostId), eq(MessageStatus.READ), any());
        }
    }
}
