import api from '../../../lib/api';
import type { ConversationSummary, Message, PageResponse, SendMessageRequest } from '../types';

export const messagingApi = {
  /**
   * Obtiene la bandeja de entrada paginada de conversaciones (activas o archivadas)
   * BaseURL de api.ts ya incluye '/api/v1', por lo que apuntamos a '/conversations'
   */
  getInbox: async (archived = false, page = 0, size = 20): Promise<PageResponse<ConversationSummary>> => {
    const response = await api.get<PageResponse<ConversationSummary>>('/conversations', {
      params: { archived, page, size },
    });
    return response.data;
  },

  /**
   * Obtiene el resumen contextual de la conversación (anuncio, estado de reserva, interlocutor, contadores)
   */
  getConversationDetail: async (conversationId: string): Promise<ConversationSummary> => {
    const response = await api.get<ConversationSummary>(`/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Obtiene el historial de mensajes de forma paginada (orden descendente: más recientes primero)
   */
  getMessages: async (conversationId: string, page = 0, size = 50): Promise<PageResponse<Message>> => {
    const response = await api.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return response.data;
  },

  /**
   * Envía un mensaje de texto dentro de una conversación
   */
  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const payload: SendMessageRequest = { content };
    const response = await api.post<Message>(
      `/conversations/${conversationId}/messages`,
      payload
    );
    return response.data;
  },

  /**
   * Inicia o recupera una conversación en modo consulta para un anuncio
   */
  startConsultation: async (listingId: string): Promise<ConversationSummary> => {
    const response = await api.post<ConversationSummary>(
      '/conversations/consultations',
      null,
      { params: { listingId } }
    );
    return response.data;
  },

  /**
   * Modifica el estado de archivado de una conversación por parte del propietario
   */
  archiveConversation: async (conversationId: string, archived: boolean): Promise<void> => {
    await api.patch(`/conversations/${conversationId}/archive`, null, {
      params: { archived },
    });
  },

  /**
   * Marca los mensajes entrantes de la conversación como leídos
   */
  markAsRead: async (conversationId: string): Promise<void> => {
    await api.patch(`/conversations/${conversationId}/read-receipt`);
  },

  /**
   * Obtiene la suma global de mensajes no leídos del usuario
   */
  getUnreadMessagesCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get<{ unreadCount: number }>('/conversations/unread-count');
    return response.data;
  },
};
