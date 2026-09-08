import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '../api/messagingApi';
import type { ConversationSummary, PageResponse } from '../types';

export const useMessagingInbox = () => {
  const queryClient = useQueryClient();
  const [isArchivedTab, setIsArchivedTab] = useState(false);
  const [page, setPage] = useState(0);

  // ─── Polling de Bandeja de Entrada (Cada 8s solo metadatos ligeros) ──────────
  const inboxQuery = useQuery<PageResponse<ConversationSummary>>({
    queryKey: ['inbox', isArchivedTab, page],
    queryFn: () => messagingApi.getInbox(isArchivedTab, page, 20),
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // ─── Mutación para Archivar / Desarchivar ──────────────────────────────────
  const archiveMutation = useMutation<void, Error, { conversationId: string; archived: boolean }>({
    mutationFn: ({ conversationId, archived }) =>
      messagingApi.archiveConversation(conversationId, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });

  // ─── Mutación para Iniciar Consulta desde un Anuncio ───────────────────────
  const startConsultationMutation = useMutation<ConversationSummary, Error, string>({
    mutationFn: (listingId: string) => messagingApi.startConsultation(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  return {
    conversations: inboxQuery.data?.content ?? [],
    totalElements: inboxQuery.data?.totalElements ?? 0,
    totalPages: inboxQuery.data?.totalPages ?? 0,
    currentPage: page,
    setPage,
    isArchivedTab,
    setIsArchivedTab: (val: boolean) => {
      setIsArchivedTab(val);
      setPage(0); // Reset página al alternar pestaña
    },
    isLoading: inboxQuery.isLoading,
    isError: inboxQuery.isError,
    refetch: inboxQuery.refetch,
    archiveConversation: (conversationId: string, archived: boolean) =>
      archiveMutation.mutateAsync({ conversationId, archived }),
    isArchiving: archiveMutation.isPending,
    startConsultation: (listingId: string) =>
      startConsultationMutation.mutateAsync(listingId),
    isStartingConsultation: startConsultationMutation.isPending,
  };
};
