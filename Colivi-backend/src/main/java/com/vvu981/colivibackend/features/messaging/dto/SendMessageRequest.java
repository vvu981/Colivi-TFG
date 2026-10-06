package com.vvu981.colivibackend.features.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotBlank(message = "El contenido del mensaje no puede estar vacío")
    @Size(max = 2000, message = "El mensaje no puede exceder los 2000 caracteres")
    String content
) {}
