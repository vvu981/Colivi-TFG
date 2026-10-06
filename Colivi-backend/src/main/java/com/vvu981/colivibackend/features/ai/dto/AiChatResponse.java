package com.vvu981.colivibackend.features.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AiChatResponse(
        @JsonProperty(required = true, value = "response")
        String response,

        @JsonProperty("draft")
        String draft,

        @JsonProperty("toolsUsed")
        List<String> toolsUsed
) {}
