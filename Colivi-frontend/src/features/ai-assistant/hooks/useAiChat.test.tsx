import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAiChat } from './useAiChat';
import { aiAssistantApi } from '../api/aiAssistantApi';

vi.mock('../api/aiAssistantApi', () => ({
  aiAssistantApi: {
    sendMessage: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAiChat hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('inicializa con el mensaje de bienvenida y sugerencias si no hay historial previo', () => {
    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.isPending).toBe(false);
  });

  it('restablece la conversación previa desde sessionStorage si ya existía', () => {
    const existingMessages = [
      { id: '1', role: 'user', content: 'Pregunta previa', timestamp: '2026-09-09T10:00:00Z' },
      { id: '2', role: 'assistant', content: 'Respuesta previa', timestamp: '2026-09-09T10:00:05Z' },
    ];
    sessionStorage.setItem('colivi_ai_chat_anonymous', JSON.stringify(existingMessages));

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Pregunta previa');
    expect(result.current.messages[1].content).toBe('Respuesta previa');
  });

  it('envía un mensaje del usuario y actualiza el historial tras la respuesta del asistente persistiendo en storage', async () => {
    const mockResponse = {
      response: 'He encontrado 2 habitaciones tranquilas en Madrid.',
      draft: 'Hola, me gustaría solicitar información para la habitación.',
    };
    vi.mocked(aiAssistantApi.sendMessage).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('Búscame colivings en Madrid');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    expect(result.current.messages[1].role).toBe('user');
    expect(result.current.messages[1].content).toBe('Búscame colivings en Madrid');

    expect(result.current.messages[2].role).toBe('assistant');
    expect(result.current.messages[2].content).toBe(mockResponse.response);
    expect(result.current.messages[2].draftContent).toBe(mockResponse.draft);

    // Comprobar persistencia en sessionStorage
    const stored = JSON.parse(sessionStorage.getItem('colivi_ai_chat_anonymous') || '[]');
    expect(stored).toHaveLength(3);
    expect(stored[1].content).toBe('Búscame colivings en Madrid');
    expect(stored[2].content).toBe(mockResponse.response);
  });

  it('maneja errores de la API agregando mensaje informativo sin romper la sesión', async () => {
    vi.mocked(aiAssistantApi.sendMessage).mockRejectedValueOnce(
      new Error('Servicio MCP no disponible')
    );

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('Ver mis tareas');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    expect(result.current.messages[2].role).toBe('assistant');
    expect(result.current.messages[2].content).toContain('Error al procesar la consulta');
  });

  it('permite limpiar el historial restableciendo el saludo inicial y vaciando el storage', async () => {
    const mockResponse = { response: 'Respuesta' };
    vi.mocked(aiAssistantApi.sendMessage).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('Hola');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');

    const stored = JSON.parse(sessionStorage.getItem('colivi_ai_chat_anonymous') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].role).toBe('assistant');
  });
});
