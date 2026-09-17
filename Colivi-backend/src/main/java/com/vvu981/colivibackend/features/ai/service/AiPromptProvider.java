package com.vvu981.colivibackend.features.ai.service;

import org.springframework.ai.chat.messages.Message;

/**
 * Contrato para el proveedor de System Prompts cognitivos.
 * Desacopla la lógica de orquestación de la carga, versionado y formateo de directivas LLM (DIP / ISP).
 */
public interface AiPromptProvider {

    /**
     * Construye y retorna el SystemMessage cognitivo con la fecha actual y el esquema de salida inyectados.
     *
     * @param outputFormat Representación en texto/schema del formato JSON requerido.
     * @return Instancia de {@link Message} configurada como mensaje de sistema.
     */
    Message createSystemMessage(String outputFormat);
}
