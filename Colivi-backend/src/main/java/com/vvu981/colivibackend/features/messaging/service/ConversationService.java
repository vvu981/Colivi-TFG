package com.vvu981.colivibackend.features.messaging.service;

import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ConversationService {

    Conversation getOrCreateConsultation(UUID tenantId, UUID listingId);

    Conversation getConversationById(UUID conversationId, UUID requesterId);

    ConversationSummaryDto getConversationSummary(UUID conversationId, UUID requesterId);

    Page<ConversationSummaryDto> getInbox(UUID userId, boolean archived, Pageable pageable);

    void archiveConversation(UUID conversationId, UUID userId, boolean archived);

    default void archiveConversationByHost(UUID conversationId, UUID hostId, boolean archived) {
        archiveConversation(conversationId, hostId, archived);
    }

    void linkBookingRequest(UUID conversationId, UUID bookingRequestId);

    void unlinkBookingRequest(UUID bookingRequestId);
}
