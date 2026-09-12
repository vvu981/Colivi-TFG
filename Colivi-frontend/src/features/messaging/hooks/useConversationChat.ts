import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { messagingApi } from '../api/messagingApi';
import { useAuth } from '../../auth/hooks/useAuth';
import type { ConversationSummary, Message, PageResponse } from '../types';

interface HeaderTrackingState {
  lastMessageAt?: string | null;
  unreadCount: number;
  interlocutorUnreadCount?: number;
}

export interface UseConversationChatOptions {
  onErrorToast?: (message: string) => void;
}

export interface UseConversationChatResult {
  conversation: ConversationSummary | undefined;
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<Message>;
  isSending: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  refetchConversation: () => void;
  toastMessage?: string | null;
  clearToast?: () => void;
}

export const useConversationChat = (
  conversationId: string | undefined,
  options?: UseConversationChatOptions
): UseConversationChatResult => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const lastHeaderStateRef = useRef<HeaderTrackingState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── 1. Polling Inteligente de Cabecera (Exclusivo a metadatos ligeros) ───────
  const conversationQuery = useQuery<ConversationSummary>({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagingApi.getConversationDetail(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 3000, // Cada 3 segundos solo la cabecera
    refetchIntervalInBackground: false, // Detener al desenfocar ventana
    refetchOnWindowFocus: true, // Sincronización instantánea al volver
    refetchOnReconnect: true,
    staleTime: 0,
  });

  // ─── 2. Historial con useInfiniteQuery (Sin sondeo ciego de mensajes) ─────────
  const messagesQuery = useInfiniteQuery<PageResponse<Message>>({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 0 }) =>
      messagingApi.getMessages(conversationId!, pageParam as number, 50),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 segundos: prohibido sondeo ciego de mensajes
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  // ─── 3. Disparo Reactivo Condicional e Invalidación Quirúrgica ───────────────
  useEffect(() => {
    const current = conversationQuery.data;
    if (!current || !conversationId) return;

    const prevState = lastHeaderStateRef.current;
    if (prevState) {
      const hasChanged =
        prevState.lastMessageAt !== current.lastMessageAt ||
        prevState.unreadCount !== current.unreadCount ||
        prevState.interlocutorUnreadCount !== current.interlocutorUnreadCount;

      if (hasChanged) {
        // Disparar refetch del historial si la cabecera indica actividad nueva o confirmación de lectura del interlocutor
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    }

    lastHeaderStateRef.current = {
      lastMessageAt: current.lastMessageAt,
      unreadCount: current.unreadCount,
      interlocutorUnreadCount: current.interlocutorUnreadCount,
    };

    // Auto-marcado de lectura si existen mensajes no leídos
    if (current.unreadCount > 0) {
      messagingApi
        .markAsRead(conversationId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['inbox'] });
        })
        .catch(() => {
          // Ignorar silenciosamente fallos de lectura transitorios
        });
    }
  }, [conversationQuery.data, conversationId, queryClient]);

  // Limpiar ref al cambiar de conversación
  useEffect(() => {
    lastHeaderStateRef.current = null;
  }, [conversationId]);

  // ─── 4. Mutación de Envío con Optimistic Updates Nativos ────────────────────
  const sendMessageMutation = useMutation<
    Message,
    Error,
    string,
    {
      previousMessages?: InfiniteData<PageResponse<Message>>;
      previousConversation?: ConversationSummary;
    }
  >({
    mutationFn: (content: string) => messagingApi.sendMessage(conversationId!, content),
    onMutate: async (content: string) => {
      if (!conversationId) return {};

      // Cancelar queries en curso para evitar que sobrescriban el estado optimista
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });

      // Snapshot del estado previo para rollback ante fallos
      const previousMessages = queryClient.getQueryData<InfiniteData<PageResponse<Message>>>([
        'messages',
        conversationId,
      ]);
      const previousConversation = queryClient.getQueryData<ConversationSummary>([
        'conversation',
        conversationId,
      ]);

      const nowIso = new Date().toISOString();
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversationId,
        senderId: user?.id ?? null,
        senderName: user ? `${user.firstName} ${user.lastName1}`.trim() : 'Tú',
        content,
        messageType: 'USER_MESSAGE',
        status: 'SENT',
        createdAt: nowIso,
        readAt: null,
        isMine: true,
        isPending: true, // Estado visual "Enviando..."
      };

      // Inserción optimista: como el backend entrega DESC, la página 0 contiene los más recientes.
      // Prependemos el nuevo mensaje en la primera página.
      queryClient.setQueryData<InfiniteData<PageResponse<Message>>>(
        ['messages', conversationId],
        (old) => {
          if (!old || old.pages.length === 0) {
            return {
              pageParams: [0],
              pages: [
                {
                  content: [optimisticMessage],
                  totalElements: 1,
                  totalPages: 1,
                  number: 0,
                  size: 50,
                  first: true,
                  last: true,
                  empty: false,
                },
              ],
            };
          }

          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            content: [optimisticMessage, ...newPages[0].content],
            totalElements: newPages[0].totalElements + 1,
          };

          return {
            ...old,
            pages: newPages,
          };
        }
      );

      // Actualizar cabecera optimista
      if (previousConversation) {
        queryClient.setQueryData<ConversationSummary>(['conversation', conversationId], {
          ...previousConversation,
          lastMessagePreview: content,
          lastMessageAt: nowIso,
        });
      }

      return { previousMessages, previousConversation };
    },
    onError: (err, _content, context) => {
      // Rollback a la foto previa
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      if (context?.previousConversation) {
        queryClient.setQueryData(['conversation', conversationId], context.previousConversation);
      }
      // Reconciliación automática ante conflictos (HTTP 409 / 400)
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });

      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Error al enviar el mensaje. Inténtalo de nuevo.');

      setToastMessage(errorMsg);
      options?.onErrorToast?.(errorMsg);
    },
    onSettled: () => {
      // Sincronizar IDs y contadores definitivos del backend
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  // ─── 5. Aplanado Cronológico para Visualización ──────────────────────────────
  const messages = useMemo<Message[]>(() => {
    if (!messagesQuery.data) return [];
    // Cada página viene DESC [nuevo ... viejo]. Al aplanar todas las páginas y hacer reverse,
    // obtenemos [antiguo ... reciente] en orden cronológico natural de lectura.
    const allDesc = messagesQuery.data.pages.flatMap((page) => page.content);
    return [...allDesc].reverse();
  }, [messagesQuery.data]);

  return {
    conversation: conversationQuery.data,
    messages,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    isError: conversationQuery.isError || messagesQuery.isError,
    error: conversationQuery.error || messagesQuery.error,
    sendMessage: (content: string) => sendMessageMutation.mutateAsync(content),
    isSending: sendMessageMutation.isPending,
    // Propiedades para scroll infinito de historial
    hasNextPage: messagesQuery.hasNextPage,
    fetchNextPage: messagesQuery.fetchNextPage,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    refetchConversation: conversationQuery.refetch,
    // Notificaciones Toast de fallos de envío
    toastMessage,
    clearToast: () => setToastMessage(null),
  };
};
