package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.core.exception.ResourceNotFoundException;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final int NUDGE_USER_MESSAGE_THRESHOLD = 4;
    private static final String NUDGE_CONTENT = "¿Todo claro? Solicita la reserva ahora para asegurar tus fechas";

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageAccessPolicyValidator accessPolicyValidator;

    @Override
    @Transactional
    public MessageResponseDto sendMessage(UUID conversationId, UUID senderId, SendMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + senderId));

        // 1. Validar política de acceso y ventana de 45 días
        accessPolicyValidator.validateCanSendMessage(conversation, sender);

        LocalDateTime now = LocalDateTime.now();
        String content = request.content().trim();
        String preview = truncate(content, 140);

        // 2. Inserción Append-Only del mensaje de usuario
        Message userMessage = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .messageType(MessageType.USER_MESSAGE)
                .status(MessageStatus.SENT)
                .build();

        Message savedMessage = messageRepository.saveAndFlush(userMessage);

        // 3. Actualización Atómica Nativa en Conversación (Evita colisiones de @Version)
        boolean isTenant = conversation.getTenant().getId().equals(senderId);
        if (isTenant) {
            conversationRepository.incrementHostUnreadAndSetLastMessage(conversationId, preview, now);
        } else {
            conversationRepository.incrementTenantUnreadAndSetLastMessage(conversationId, preview, now);
        }

        // 4. Estrategia de Conversión (O(1) en memoria + cerrojo atómico SQL con incremento de tenantUnreadCount)
        int projectedCount = conversation.getUserMessageCount() + 1;

        if (projectedCount >= NUDGE_USER_MESSAGE_THRESHOLD && conversation.getActiveBookingRequest() == null) {
            // Cerrojo atómico condicional en base de datos: solo una petición concurrente podrá reclamar el Nudge
            int claimed = conversationRepository.claimNudgeAndSetLastMessage(
                    conversationId,
                    NUDGE_CONTENT,
                    now.plusNanos(1_000_000));

            if (claimed > 0) {
                Message systemNudge = Message.builder()
                        .conversation(conversation)
                        .sender(null) // Emitido por la plataforma
                        .content(NUDGE_CONTENT)
                        .messageType(MessageType.SYSTEM_MESSAGE)
                        .status(MessageStatus.SENT)
                        .build();

                messageRepository.saveAndFlush(systemNudge);
            }
        }

        return MessageResponseDto.fromEntity(savedMessage, senderId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponseDto> getMessages(UUID conversationId, UUID requesterId, Pageable pageable) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        accessPolicyValidator.validateCanAccessConversation(conversation, requesterId);

        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable)
                .map(m -> MessageResponseDto.fromEntity(m, requesterId));
    }

    @Override
    @Transactional
    public void markConversationAsRead(UUID conversationId, UUID readerId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Conversación no encontrada con ID: " + conversationId));

        accessPolicyValidator.validateCanAccessConversation(conversation, readerId);

        LocalDateTime now = LocalDateTime.now();
        boolean isTenant = conversation.getTenant().getId().equals(readerId);

        if (isTenant) {
            conversationRepository.resetTenantUnreadCount(conversationId);
        } else {
            conversationRepository.resetHostUnreadCount(conversationId);
        }

        messageRepository.markIncomingMessagesAsRead(conversationId, readerId, MessageStatus.READ, now);
    }

    private String truncate(String text, int maxLength) {
        if (text == null)
            return "";
        if (text.length() <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + "...";
    }
}
