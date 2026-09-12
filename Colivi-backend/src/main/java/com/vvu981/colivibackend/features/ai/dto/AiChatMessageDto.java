package com.vvu981.colivibackend.features.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiChatMessageDto(
        @JsonProperty("role") String role,
        @JsonProperty("content") String content
) {}
