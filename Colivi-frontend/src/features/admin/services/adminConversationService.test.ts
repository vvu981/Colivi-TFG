import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { adminConversationService } from './adminConversationService';

vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('adminConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getConversationDossier calls /admin/conversations/:id/dossier correctly', async () => {
    const mockDossier = {
      conversationId: 'conv-999',
      listing: null,
      tenant: {
        id: 'tenant-1',
        nickname: 'lucia',
        firstName: 'Lucia',
        lastName: 'F',
        email: 'lucia@test.com',
        profilePicUrl: null,
        role: 'TENANT',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      host: {
        id: 'host-1',
        nickname: 'marcos',
        firstName: 'Marcos',
        lastName: 'P',
        email: 'marcos@test.com',
        profilePicUrl: null,
        role: 'OWNER',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      activeBooking: null,
      messages: [],
      createdAt: '2026-09-07T12:00:00Z',
      lastMessageAt: null,
      isReported: true,
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDossier });

    const result = await adminConversationService.getConversationDossier('conv-999');

    expect(api.get).toHaveBeenCalledWith('/admin/conversations/conv-999/dossier');
    expect(result).toEqual(mockDossier);
  });
});
