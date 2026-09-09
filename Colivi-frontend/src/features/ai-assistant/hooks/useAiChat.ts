import { useState, useCallback, useEffect, useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '../../auth/context/AuthContext';
import { aiAssistantApi } from '../api/aiAssistantApi';
import type { AiChatMessage, AiChatRequest, AiChatResponse, QuickPromptSuggestion } from '../types';

const INITIAL_GREETING: AiChatMessage = {
  id: 'greeting-msg',
  role: 'assistant',
  content: 'Hola. Soy el Asistente Inteligente de Colivi con conexión directa al servidor de herramientas MCP. Puedo ayudarte a consultar el estado de tus tareas del hogar, buscar alojamientos compatibles con tu estilo de vida o resumir tus conversaciones de anfitrión.',
  timestamp: new Date().toISOString(),
};

export const DEFAULT_SUGGESTIONS: QuickPromptSuggestion[] = [
  {
    id: 'chores',
    label: 'Mis tareas del hogar',
    prompt: '¿Cuáles son mis tareas del hogar asignadas y cómo voy en el ranking?',
  },
  {
    id: 'search-quiet',
    label: 'Buscar coliving tranquilo',
    prompt: 'Búscame habitaciones disponibles con ambiente tranquilo (QUIET) por menos de 600€.',
  },
  {
    id: 'inbox-summary',
    label: 'Resumen de solicitudes',
    prompt: 'Hazme un resumen de los mensajes pendientes de candidatos en mis anuncios.',
  },
];

const getStorageKey = (userId?: string) => `colivi_ai_chat_${userId || 'anonymous'}`;

const loadStoredMessages = (storageKey: string): AiChatMessage[] => {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Manejo defensivo ante fallos de acceso o parseo
  }
  return [INITIAL_GREETING];
};

const saveMessagesToStorage = (storageKey: string, messages: AiChatMessage[]) => {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  } catch {
    // Manejo defensivo ante cuotas excedidas o restricciones de storage
  }
};

export const useAiChat = () => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;
  const storageKey = getStorageKey(userId);

  const [messages, setMessages] = useState<AiChatMessage[]>(() => loadStoredMessages(storageKey));

  useEffect(() => {
    setMessages(loadStoredMessages(storageKey));
  }, [storageKey]);

  useEffect(() => {
    saveMessagesToStorage(storageKey, messages);
  }, [messages, storageKey]);

  const chatMutation = useMutation<AiChatResponse, Error, string>({
    mutationFn: async (messageText: string) => {
      // Prepara el historial reciente excluyendo el mensaje de bienvenida inicial
      const historyPayload = messages
        .filter((msg) => msg.id !== 'greeting-msg')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const payload: AiChatRequest = {
        message: messageText,
        history: historyPayload,
      };

      return aiAssistantApi.sendMessage(payload);
    },
    onMutate: (messageText: string) => {
      const userMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        saveMessagesToStorage(storageKey, updated);
        return updated;
      });
    },
    onSuccess: (data: AiChatResponse) => {
      const assistantMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'No se ha recibido respuesta del modelo.',
        draftContent: data.draft,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        saveMessagesToStorage(storageKey, updated);
        return updated;
      });
    },
    onError: (err: Error) => {
      const errorMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error al procesar la consulta: ${err.message || 'El servicio de IA no responde en este momento.'}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        saveMessagesToStorage(storageKey, updated);
        return updated;
      });
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatMutation.isPending) return;
      chatMutation.mutate(trimmed);
    },
    [chatMutation]
  );

  const clearHistory = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignorar excepciones al limpiar
    }
    const resetMessage: AiChatMessage = {
      ...INITIAL_GREETING,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setMessages([resetMessage]);
    saveMessagesToStorage(storageKey, [resetMessage]);
  }, [storageKey]);

  return {
    messages,
    sendMessage,
    isPending: chatMutation.isPending,
    error: chatMutation.error,
    clearHistory,
    suggestions: DEFAULT_SUGGESTIONS,
  };
};
