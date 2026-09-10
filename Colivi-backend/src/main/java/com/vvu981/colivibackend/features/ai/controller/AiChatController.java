package com.vvu981.colivibackend.features.ai.controller;

import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import com.vvu981.colivibackend.features.ai.service.AiOrchestratorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Copilot", description = "Asistente inteligente con integración de herramientas MCP y Groq")
@SecurityRequirement(name = "bearerAuth")
public class AiChatController {

    private final AiOrchestratorService orchestratorService;

    public AiChatController(AiOrchestratorService orchestratorService) {
        this.orchestratorService = orchestratorService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Procesar consulta conversacional con el Asistente IA")
    @ApiResponse(responseCode = "200", description = "Respuesta estructurada del asistente con datos de MCP o propuesta de borrador")
    @ApiResponse(responseCode = "400", description = "Petición inválida o mensaje vacío")
    @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader
    ) {
        String jwtToken = null;
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            jwtToken = authHeader.substring(7).trim();
        }

        AiChatResponse response = orchestratorService.processChat(request, jwtToken);
        return ResponseEntity.ok(response);
    }
}
