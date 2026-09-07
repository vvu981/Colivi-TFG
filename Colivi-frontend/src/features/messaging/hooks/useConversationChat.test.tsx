import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversationChat } from './useConversationChat';
import { messagingApi } from '../api/messagingApi';
import type { ConversationSummary, Message, PageResponse } from '../types';

// Mock del cliente API
vi.mock('../api/messagingApi', () => ({
  messagingApi: {
    getConversationDetail: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

// Mock del Auth Hook
vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'tenant-123', firstName: 'Víctor', lastName1: 'Vázquez' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversationChat hook', () => {
  const mockConversationId = 'conv-456';

  const mockConversation: ConversationSummary = {
    conversationId: mockConversationId,
    listingId: 'list-789',
    listingTitle: 'Habitación Luminosa Centro',
    listingPricePerMonth: 450,
    interlocutorId: 'host-999',
    interlocutorName: 'Ana Propietaria',
    interlocutorProfilePic: null,
    activeBookingRequestId: null,
    bookingStatus: 'CONSULTATION',
    lastMessagePreview: 'Hola, ¿sigue disponible?',
    lastMessageAt: '2026-09-06T18:00:00Z',
    unreadCount: 0,
    isArchived: false,
    isHost: false,
  };

  const mockMessage1: Message = {
    id: 'm1',
    conversationId: mockConversationId,
    senderId: 'tenant-123',
    senderName: 'Víctor Vázquez',
    content: 'Primer mensaje más antiguo',
    messageType: 'USER_MESSAGE',
    status: 'READ',
    createdAt: '2026-09-06T17:50:00Z',
    readAt: '2026-09-06T17:55:00Z',
    isMine: true,
  };

  const mockMessage2: Message = {
    id: 'm2',
    conversationId: mockConversationId,
    senderId: 'host-999',
    senderName: 'Ana Propietaria',
    content: 'Segundo mensaje más reciente',
    messageType: 'USER_MESSAGE',
    status: 'SENT',
    createdAt: '2026-09-06T18:00:00Z',
    readAt: null,
    isMine: false,
  };

  // El backend entrega en orden DESC: [m2 (reciente), m1 (antiguo)]
  const mockPageResponse: PageResponse<Message> = {
    content: [mockMessage2, mockMessage1],
    totalElements: 2,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messagingApi.getConversationDetail).mockResolvedValue(mockConversation);
    vi.mocked(messagingApi.getMessages).mockResolvedValue(mockPageResponse);
    vi.mocked(messagingApi.sendMessage).mockImplementation(async (_convId, content) => ({
      id: 'm3-server',
      conversationId: mockConversationId,
      senderId: 'tenant-123',
      senderName: 'Víctor Vázquez',
      content,
      messageType: 'USER_MESSAGE',
      status: 'SENT',
      createdAt: new Date().toISOString(),
      readAt: null,
      isMine: true,
    }));
    vi.mocked(messagingApi.markAsRead).mockResolvedValue();
  });

  it('carga la conversación y formatea los mensajes en orden cronológico ascendente para lectura', async () => {
    const { result } = renderHook(() => useConversationChat(mockConversationId), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversation?.conversationId).toBe(mockConversationId);
    expect(result.current.messages).toHaveLength(2);
    // Orden cronológico: m1 (antiguo) al principio, m2 (reciente) al final
    expect(result.current.messages[0].id).toBe('m1');
    expect(result.current.messages[1].id).toBe('m2');
  });

  it('realiza actualización optimista instantánea al enviar un mensaje', async () => {
    const { result } = renderHook(() => useConversationChat(mockConversationId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('Mensaje de prueba optimista');
    });

    expect(messagingApi.sendMessage).toHaveBeenCalledWith(
      mockConversationId,
      'Mensaje de prueba optimista'
    );
  });
});
