package com.vvu981.colivibackend.features.ai.controller;

import com.vvu981.colivibackend.features.ai.dto.AiChatRequest;
import com.vvu981.colivibackend.features.ai.dto.AiChatResponse;
import com.vvu981.colivibackend.features.ai.service.AiOrchestratorService;
import com.vvu981.colivibackend.features.user.exception.InvalidTokenException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
    @ApiResponse(responseCode = "400", description = "Peticion invalida, mensaje vacio o demasiado largo")
    @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o invalido")
    @ApiResponse(responseCode = "429", description = "Demasiadas peticiones - limite de velocidad superado")
    @ApiResponse(responseCode = "503", description = "Servicio no disponible - circuit breaker abierto")
    @RateLimiter(name = "aiChat", fallbackMethod = "rateLimitFallback")
    @CircuitBreaker(name = "aiChat", fallbackMethod = "circuitBreakerFallback")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader
    ) {
        // F-04: El controlador desacopla la extraccion del protocolo HTTP de la validacion.
        // La validacion de presencia y validez del token se delega exclusivamente al servicio (SRP / DRY).
        String jwtToken = (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7))
                ? authHeader.substring(7).trim()
                : null;

        // ARC-01: La validación de tamaño del mensaje (máx 2000) y del historial (máx 20)
        // se delega declarativamente a Bean Validation (@Valid + @Size en AiChatRequest),
        // garantizando consistencia de formato de error en GlobalExceptionHandler y cumpliendo SRP.
        AiChatResponse response = orchestratorService.processChat(request, jwtToken);
        return ResponseEntity.ok(response);
    }

    /**
     * Fallback invocado por Resilience4j cuando se supera el rate limit de aiChat.
     * Devuelve HTTP 429 Too Many Requests con mensaje claro.
     */
    public ResponseEntity<AiChatResponse> rateLimitFallback(
            AiChatRequest request, String authHeader, Throwable ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new AiChatResponse(
                        "Has superado el limite de consultas al asistente. Por favor, espera un momento antes de volver a intentarlo.",
                        null,
                        java.util.List.of()));
    }

    /**
     * Fallback invocado por Resilience4j cuando el Circuit Breaker esta abierto
     * debido a fallos reiterados en la comunicacion con Groq o el servidor MCP (F-06).
     * Devuelve HTTP 503 Service Unavailable con mensaje claro.
     */
    public ResponseEntity<AiChatResponse> circuitBreakerFallback(
            AiChatRequest request, String authHeader, Throwable ex) {
        // F-BUG-01: Si la excepcion interceptada es un error de autenticacion de cliente (401),
        // relanzarla inmediatamente para que GlobalExceptionHandler responda con HTTP 401
        // en lugar de enmascararla con un 503 Service Unavailable.
        if (ex instanceof InvalidTokenException ite) {
            throw ite;
        }
        if (ex != null && ex.getCause() instanceof InvalidTokenException ite) {
            throw ite;
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new AiChatResponse(
                        "El servicio del asistente inteligente no esta disponible temporalmente por degradacion del sistema. Por favor, intentalo de nuevo en unos minutos.",
                        null,
                        java.util.List.of()));
    }
}
