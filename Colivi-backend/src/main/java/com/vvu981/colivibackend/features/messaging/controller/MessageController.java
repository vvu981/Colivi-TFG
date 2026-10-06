package com.vvu981.colivibackend.features.messaging.controller;

import com.vvu981.colivibackend.features.messaging.dto.MessageResponseDto;
import com.vvu981.colivibackend.features.messaging.dto.SendMessageRequest;
import com.vvu981.colivibackend.features.messaging.service.MessageService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/conversations/{conversationId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<Page<MessageResponseDto>> getMessages(
            @PathVariable UUID conversationId,
            @PageableDefault(size = 50) Pageable pageable,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        return ResponseEntity.ok(messageService.getMessages(conversationId, currentUserId, pageable));
    }

    @PostMapping
    public ResponseEntity<MessageResponseDto> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal(expression = "id") UUID currentUserId) {
        MessageResponseDto response = messageService.sendMessage(conversationId, currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
