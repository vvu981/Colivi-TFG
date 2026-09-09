import api from '../../../lib/api';
import type { AiChatRequest, AiChatResponse } from '../types';

export const aiAssistantApi = {
  /**
   * Envía el mensaje del usuario y el historial relevante al orquestador de IA.
   * Endpoint esperado: POST /api/v1/ai/chat
   * Adjunta explícitamente Authorization: Bearer <token> para propagación al MCP.
   */
  sendMessage: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await api.post<AiChatResponse>('/ai/chat', payload, { headers });
    return response.data;
  },
};
