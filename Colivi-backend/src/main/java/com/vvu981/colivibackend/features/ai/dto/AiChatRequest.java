package com.vvu981.colivibackend.features.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AiChatRequest(
        @NotBlank(message = "El mensaje no puede estar vacío")
        @JsonProperty("message")
        String message,

        @JsonProperty("history")
        List<AiChatMessageDto> history
) {}
