package com.vvu981.colivibackend.features.messaging.controller;

import com.vvu981.colivibackend.features.messaging.dto.AdminConversationDossierDto;
import com.vvu981.colivibackend.features.messaging.service.AdminConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/conversations")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminConversationController {

    private final AdminConversationService adminConversationService;

    @GetMapping("/{id}/dossier")
    public ResponseEntity<AdminConversationDossierDto> getConversationDossier(@PathVariable UUID id) {
        return ResponseEntity.ok(adminConversationService.getConversationDossier(id));
    }
}
