package com.vvu981.colivibackend.features.messaging.dto;

import com.vvu981.colivibackend.features.messaging.domain.Message;
import com.vvu981.colivibackend.features.messaging.domain.MessageStatus;
import com.vvu981.colivibackend.features.messaging.domain.MessageType;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponseDto(
    UUID id,
    UUID conversationId,
    UUID senderId,
    String senderName,
    String content,
    MessageType messageType,
    MessageStatus status,
    LocalDateTime createdAt,
    LocalDateTime readAt,
    boolean isMine
) {
    public static MessageResponseDto fromEntity(Message message, UUID currentUserId) {
        UUID senderId = message.getSender() != null ? message.getSender().getId() : null;
        String senderName = message.getSender() != null 
                ? message.getSender().getFirstName() + " " + message.getSender().getLastName1() 
                : "Sistema";
        boolean isMine = senderId != null && senderId.equals(currentUserId);

        return new MessageResponseDto(
            message.getId(),
            message.getConversation().getId(),
            senderId,
            senderName,
            message.getContent(),
            message.getMessageType(),
            message.getStatus(),
            message.getCreatedAt(),
            message.getReadAt(),
            isMine
        );
    }
}
