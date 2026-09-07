package com.vvu981.colivibackend.features.messaging.controller;

import com.vvu981.colivibackend.features.messaging.domain.Conversation;
import com.vvu981.colivibackend.features.messaging.dto.ConversationSummaryDto;
import com.vvu981.colivibackend.features.messaging.service.ConversationService;
import com.vvu981.colivibackend.features.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    @PostMapping("/consultations")
    public ResponseEntity<ConversationSummaryDto> startConsultation(
            @RequestParam UUID listingId,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        Conversation conversation = conversationService.getOrCreateConsultation(currentUserId, listingId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ConversationSummaryDto.fromEntity(conversation, currentUserId));
    }

    @GetMapping
    public ResponseEntity<Page<ConversationSummaryDto>> getInbox(
            @RequestParam(defaultValue = "false") boolean archived,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        return ResponseEntity.ok(conversationService.getInbox(currentUserId, archived, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationSummaryDto> getConversationDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        return ResponseEntity.ok(conversationService.getConversationSummary(id, currentUserId));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveConversation(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean archived,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        conversationService.archiveConversationByHost(id, currentUserId, archived);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/read-receipt")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        messageService.markConversationAsRead(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
