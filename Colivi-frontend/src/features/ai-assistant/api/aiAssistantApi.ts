import api from '../../../lib/api';
import type { AiChatRequest, AiChatResponse } from '../types';
import axios from 'axios';

/**
 * Errores HTTP especificos con mensajes utiles para el usuario.
 * F-27: Evitar mostrar mensajes genericos de Axios como "Request failed with status 503".
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'La solicitud al asistente contiene datos invalidos.',
  401: 'Tu sesion ha expirado. Por favor, vuelve a iniciar sesion.',
  403: 'No tienes permisos para acceder al asistente de IA.',
  429: 'Has superado el limite de consultas. Por favor, espera un momento.',
  500: 'El servidor ha encontrado un error interno. Intentalo de nuevo mas tarde.',
  502: 'El asistente inteligente no esta disponible en este momento.',
  503: 'El servicio de IA no esta disponible temporalmente. Intentalo en unos minutos.',
  504: 'El asistente tardo demasiado en responder. Intentalo de nuevo.',
};

export const aiAssistantApi = {
  /**
   * Envia el mensaje del usuario y el historial relevante al orquestador de IA.
   * Endpoint esperado: POST /api/v1/ai/chat
   * El token JWT se inyecta automaticamente mediante el interceptor de Axios en lib/api.
   */
  sendMessage: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    try {
      const response = await api.post<AiChatResponse>('/ai/chat', payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;

        // UX-01: Si el backend devuelve errores de validación específicos (@Valid), mostrarlos con prioridad
        if (status === 400 && error.response.data) {
          const data = error.response.data as { message?: string; errors?: Record<string, string> };
          if (data.errors && typeof data.errors === 'object') {
            const firstError = Object.values(data.errors)[0];
            if (firstError) {
              throw new Error(firstError);
            }
          }
          if (data.message && typeof data.message === 'string' && data.message !== 'Validation failed') {
            throw new Error(data.message);
          }
        }

        const friendlyMessage =
          HTTP_ERROR_MESSAGES[status] ??
          `Error inesperado del servidor (${status}). Por favor, intentalo de nuevo.`;
        throw new Error(friendlyMessage);
      }
      // Error de red (sin respuesta del servidor)
      throw new Error('No se pudo conectar con el servidor. Comprueba tu conexion a internet.');
    }
  },
};
