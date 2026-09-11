package com.vvu981.colivibackend.features.ai.exception;

/**
 * Excepcion de dominio para fallos en la orquestacion del asistente IA.
 * Reemplaza RuntimeException generico para evitar filtracion de detalles internos al cliente.
 * Manejada en GlobalExceptionHandler con respuesta sanitizada y HTTP 502.
 */
public class AiOrchestratorException extends RuntimeException {

    public AiOrchestratorException(String message) {
        super(message);
    }

    public AiOrchestratorException(String message, Throwable cause) {
        super(message, cause);
    }
}
