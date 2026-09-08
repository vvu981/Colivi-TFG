import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messagingApi } from './messagingApi';
import api from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('messagingApi Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getInbox debe llamar a GET /conversations con los parámetros correspondientes', async () => {
    const mockData = { content: [], totalElements: 0, totalPages: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await messagingApi.getInbox(true, 1, 15);

    expect(api.get).toHaveBeenCalledWith('/conversations', {
      params: { archived: true, page: 1, size: 15 },
    });
    expect(result).toEqual(mockData);
  });

  it('getInbox con valores por defecto debe consultar archived=false, page=0, size=20', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { content: [] } });

    await messagingApi.getInbox();

    expect(api.get).toHaveBeenCalledWith('/conversations', {
      params: { archived: false, page: 0, size: 20 },
    });
  });

  it('getConversationDetail debe llamar a GET /conversations/:id', async () => {
    const mockDetail = { conversationId: 'c-1', listingTitle: 'Habitación' };
    vi.mocked(api.get).mockResolvedValue({ data: mockDetail });

    const result = await messagingApi.getConversationDetail('c-1');

    expect(api.get).toHaveBeenCalledWith('/conversations/c-1');
    expect(result).toEqual(mockDetail);
  });

  it('getMessages debe llamar a GET /conversations/:id/messages con paginación', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: mockPage });

    const result = await messagingApi.getMessages('c-1', 2, 25);

    expect(api.get).toHaveBeenCalledWith('/conversations/c-1/messages', {
      params: { page: 2, size: 25 },
    });
    expect(result).toEqual(mockPage);
  });

  it('sendMessage debe llamar a POST /conversations/:id/messages con el payload de contenido', async () => {
    const mockSent = { id: 'm-1', content: 'Hola mundo' };
    vi.mocked(api.post).mockResolvedValue({ data: mockSent });

    const result = await messagingApi.sendMessage('c-1', 'Hola mundo');

    expect(api.post).toHaveBeenCalledWith('/conversations/c-1/messages', { content: 'Hola mundo' });
    expect(result).toEqual(mockSent);
  });

  it('startConsultation debe llamar a POST /conversations/consultations con listingId en params', async () => {
    const mockConv = { conversationId: 'c-new', listingId: 'list-100' };
    vi.mocked(api.post).mockResolvedValue({ data: mockConv });

    const result = await messagingApi.startConsultation('list-100');

    expect(api.post).toHaveBeenCalledWith(
      '/conversations/consultations',
      null,
      { params: { listingId: 'list-100' } }
    );
    expect(result).toEqual(mockConv);
  });

  it('archiveConversation debe llamar a PATCH /conversations/:id/archive con archived en params', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: null });

    await messagingApi.archiveConversation('c-1', true);

    expect(api.patch).toHaveBeenCalledWith(
      '/conversations/c-1/archive',
      null,
      { params: { archived: true } }
    );
  });

  it('markAsRead debe llamar a PATCH /conversations/:id/read-receipt', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: null });

    await messagingApi.markAsRead('c-1');

    expect(api.patch).toHaveBeenCalledWith('/conversations/c-1/read-receipt');
  });

  it('getUnreadMessagesCount debe llamar a GET /conversations/unread-count', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { unreadCount: 5 } });

    const result = await messagingApi.getUnreadMessagesCount();

    expect(api.get).toHaveBeenCalledWith('/conversations/unread-count');
    expect(result).toEqual({ unreadCount: 5 });
  });
});
