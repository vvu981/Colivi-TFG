import { useState, useCallback, useEffect, useContext, useRef } from 'react';
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

// F-23: Persistencia en localStorage para garantizar sincronizacion del historial entre
// multiples pestanas del navegador (ej. comparando habitaciones o revisando tareas)
const loadStoredMessages = (storageKey: string): AiChatMessage[] => {
  try {
    const raw = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
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
    localStorage.setItem(storageKey, JSON.stringify(messages));
  } catch {
    // Manejo defensivo ante cuotas excedidas o restricciones de storage
  }
};

export const useAiChat = () => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;
  const storageKey = getStorageKey(userId);

  const [messages, setMessages] = useState<AiChatMessage[]>(() => loadStoredMessages(storageKey));
  const messagesRef = useRef<AiChatMessage[]>(messages);
  // BUG-02: Referencia que registra la clave bajo la cual se cargaron los mensajes activos en memoria.
  const currentLoadedKeyRef = useRef<string>(storageKey);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const loaded = loadStoredMessages(storageKey);
    currentLoadedKeyRef.current = storageKey;
    messagesRef.current = loaded;
    setMessages(loaded);
  }, [storageKey]);

  useEffect(() => {
    // BUG-02: Solo guardar si los mensajes actuales corresponden a la clave activa actual,
    // evitando que en transiciones de autenticación los mensajes de la sesión anónima
    // sobrescriban destructivamente el historial del usuario autenticado.
    if (currentLoadedKeyRef.current === storageKey) {
      saveMessagesToStorage(storageKey, messages);
    }
  }, [messages, storageKey]);

  // F-23: Sincronización real del historial entre múltiples pestañas del navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              messagesRef.current = parsed;
              setMessages(parsed);
            }
          } catch {
            // Ignorar parseos defectuosos externos
          }
        } else {
          // UX-02: Si otra pestaña limpió el historial (removeItem), sincronizar y restablecer saludo inicial
          const resetMessage: AiChatMessage = {
            ...INITIAL_GREETING,
            timestamp: new Date().toISOString(),
          };
          messagesRef.current = [resetMessage];
          setMessages([resetMessage]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const chatMutation = useMutation<AiChatResponse, Error, string>({
    mutationFn: async (messageText: string) => {
      // Prepara el historial reciente excluyendo el mensaje de bienvenida inicial y mensajes de error
      // FNT-01: Usar messagesRef.current sincronizado de forma segura
      // BUG-01: Truncar la ventana deslizante del historial a un máximo de 20 mensajes
      // para respetar estrictamente la restricción @Size(max = 20) de AiChatRequest del backend.
      const currentMessages = messagesRef.current;
      const historyPayload = currentMessages
        .filter((msg) => msg.id !== 'greeting-msg' && !msg.isError)
        .slice(-20)
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
        const next = [...prev, userMessage];
        messagesRef.current = next;
        return next;
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
        const next = [...prev, assistantMessage];
        messagesRef.current = next;
        return next;
      });
    },
    onError: (err: Error) => {
      const errorMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error al procesar la consulta: ${err.message || 'El servicio de IA no responde en este momento.'}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => {
        const next = [...prev, errorMessage];
        messagesRef.current = next;
        return next;
      });
    },
  });

  const isAuthenticated = !!(auth?.user || auth?.isAuthenticated);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      // F-24: Se referencian chatMutation.mutate y chatMutation.isPending directamente
      // en lugar del objeto chatMutation completo, que es nuevo en cada render de useMutation
      // e invalidaria la memoizacion del useCallback en cada ciclo de render.
      if (!isAuthenticated || !trimmed || chatMutation.isPending) return;
      chatMutation.mutate(trimmed);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatMutation.mutate, chatMutation.isPending, isAuthenticated]
  );

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignorar excepciones al limpiar
    }
    const resetMessage: AiChatMessage = {
      ...INITIAL_GREETING,
      timestamp: new Date().toISOString(),
    };
    messagesRef.current = [resetMessage];
    setMessages([resetMessage]);
  }, [storageKey]);

  return {
    messages,
    sendMessage,
    isPending: chatMutation.isPending,
    error: chatMutation.error,
    clearHistory,
    suggestions: DEFAULT_SUGGESTIONS,
    isAuthenticated,
  };
};
