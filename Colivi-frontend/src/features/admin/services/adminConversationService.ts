import api from '../../../lib/api';
import type { AdminConversationDossier } from '../types/admin.types';

export const adminConversationService = {
  getConversationDossier: async (conversationId: string): Promise<AdminConversationDossier> => {
    const response = await api.get<AdminConversationDossier>(
      `/admin/conversations/${conversationId}/dossier`
    );
    return response.data;
  },
};
