package com.vvu981.colivibackend.features.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AiChatRequest(
        @NotBlank(message = "El mensaje no puede estar vacío")
        @Size(max = 2000, message = "El mensaje supera el límite de 2000 caracteres permitidos")
        @JsonProperty("message")
        String message,

        @Size(max = 20, message = "El historial de conversación supera el máximo de 20 mensajes permitidos")
        @JsonProperty("history")
        List<AiChatMessageDto> history
) {}
