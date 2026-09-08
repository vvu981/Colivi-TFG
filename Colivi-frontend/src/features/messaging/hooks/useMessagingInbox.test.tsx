import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessagingInbox } from './useMessagingInbox';
import { messagingApi } from '../api/messagingApi';
import type { ConversationSummary, PageResponse } from '../types';

vi.mock('../api/messagingApi', () => ({
  messagingApi: {
    getInbox: vi.fn(),
    archiveConversation: vi.fn(),
    startConsultation: vi.fn(),
  },
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

describe('useMessagingInbox hook', () => {
  const mockConversation: ConversationSummary = {
    conversationId: 'c-1',
    listingId: 'l-1',
    listingTitle: 'Habitación Luminosa',
    listingPricePerMonth: 400,
    interlocutorId: 'u-2',
    interlocutorName: 'Ana',
    interlocutorProfilePic: null,
    activeBookingRequestId: null,
    bookingStatus: 'CONSULTATION',
    lastMessagePreview: 'Hola',
    lastMessageAt: '2026-09-07T12:00:00Z',
    unreadCount: 1,
    isArchived: false,
    isHost: false,
    isReported: false,
  };

  const mockPageResponse: PageResponse<ConversationSummary> = {
    content: [mockConversation],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messagingApi.getInbox).mockResolvedValue(mockPageResponse);
  });

  it('debe cargar la lista de conversaciones y metadatos iniciales', async () => {
    const { result } = renderHook(() => useMessagingInbox(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].conversationId).toBe('c-1');
    expect(result.current.totalElements).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.isArchivedTab).toBe(false);
  });

  it('debe cambiar la pestaña a archivada y resetear la página a 0', async () => {
    const { result } = renderHook(() => useMessagingInbox(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.setIsArchivedTab(true);
    });

    expect(result.current.isArchivedTab).toBe(true);
    expect(result.current.currentPage).toBe(0);
  });

  it('debe ejecutar archiveConversation y llamar a la API', async () => {
    vi.mocked(messagingApi.archiveConversation).mockResolvedValue();

    const { result } = renderHook(() => useMessagingInbox(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.archiveConversation('c-1', true);
    });

    expect(messagingApi.archiveConversation).toHaveBeenCalledWith('c-1', true);
  });

  it('debe ejecutar startConsultation y llamar a la API', async () => {
    vi.mocked(messagingApi.startConsultation).mockResolvedValue(mockConversation);

    const { result } = renderHook(() => useMessagingInbox(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let newConv: ConversationSummary | undefined;
    await act(async () => {
      newConv = await result.current.startConsultation('l-1');
    });

    expect(messagingApi.startConsultation).toHaveBeenCalledWith('l-1');
    expect(newConv).toEqual(mockConversation);
  });
});
