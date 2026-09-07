package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.features.messaging.dto.MessageResponseDto;
import com.vvu981.colivibackend.features.messaging.dto.SendMessageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MessageService {

    MessageResponseDto sendMessage(UUID conversationId, UUID senderId, SendMessageRequest request);

    Page<MessageResponseDto> getMessages(UUID conversationId, UUID requesterId, Pageable pageable);

    void markConversationAsRead(UUID conversationId, UUID readerId);
}
