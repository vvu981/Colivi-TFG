import api from '../../../lib/api';
import type { AiChatRequest, AiChatResponse } from '../types';

export const aiAssistantApi = {
  /**
   * Envía el mensaje del usuario y el historial relevante al orquestador de IA.
   * Endpoint esperado: POST /api/v1/ai/chat
   * El token JWT se inyecta automáticamente mediante el interceptor de Axios en lib/api.
   */
  sendMessage: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    const response = await api.post<AiChatResponse>('/ai/chat', payload);
    return response.data;
  },
};
