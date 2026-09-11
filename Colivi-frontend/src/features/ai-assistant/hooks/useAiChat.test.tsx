import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextType } from '../../auth/context/AuthContext';
import { useAiChat } from './useAiChat';
import { aiAssistantApi } from '../api/aiAssistantApi';

vi.mock('../api/aiAssistantApi', () => ({
  aiAssistantApi: {
    sendMessage: vi.fn(),
  },
}));

const mockAuthContext: AuthContextType = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'testuser',
    firstName: 'Test',
    lastName1: 'User',
    lastName2: null,
    phone: null,
    role: 'USER',
    profilePicUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  register: vi.fn(),
  reactivateAccount: vi.fn(),
  updateUserContextData: vi.fn(),
  logout: vi.fn(),
};

const createWrapper = (authOverride?: Partial<AuthContextType>) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: AuthContextType = {
    ...mockAuthContext,
    ...authOverride,
  };

  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
};

describe('useAiChat hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('inicializa con el mensaje de bienvenida y sugerencias si no hay historial previo', () => {
    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.isPending).toBe(false);
  });

  it('restablece la conversación previa desde localStorage si ya existía (F-23)', () => {
    const existingMessages = [
      { id: '1', role: 'user', content: 'Pregunta previa', timestamp: '2026-09-09T10:00:00Z' },
      { id: '2', role: 'assistant', content: 'Respuesta previa', timestamp: '2026-09-09T10:00:05Z' },
    ];
    localStorage.setItem('colivi_ai_chat_user-123', JSON.stringify(existingMessages));

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Pregunta previa');
    expect(result.current.messages[1].content).toBe('Respuesta previa');
  });

  it('migra transparentemente historial previo desde sessionStorage si localStorage estaba vacío (F-23)', () => {
    const existingMessages = [
      { id: '1', role: 'user', content: 'Pregunta previa en session', timestamp: '2026-09-09T10:00:00Z' },
    ];
    sessionStorage.setItem('colivi_ai_chat_user-123', JSON.stringify(existingMessages));

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Pregunta previa en session');
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

    // Comprobar persistencia en localStorage
    const stored = JSON.parse(localStorage.getItem('colivi_ai_chat_user-123') || '[]');
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

    const stored = JSON.parse(localStorage.getItem('colivi_ai_chat_user-123') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].role).toBe('assistant');
    expect(stored[0].id).toBe('greeting-msg');
  });

  it('excluye el mensaje de bienvenida y los mensajes de error del historyPayload enviado a la API', async () => {
    vi.mocked(aiAssistantApi.sendMessage).mockResolvedValueOnce({ response: 'Primera respuesta' });

    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.sendMessage('Primer mensaje');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    // Simular siguiente envío para inspeccionar qué payload se genera
    vi.mocked(aiAssistantApi.sendMessage).mockResolvedValueOnce({ response: 'Segunda respuesta' });

    await act(async () => {
      result.current.sendMessage('Segundo mensaje');
    });

    await waitFor(() => {
      expect(aiAssistantApi.sendMessage).toHaveBeenCalledTimes(2);
    });

    const secondCallPayload = vi.mocked(aiAssistantApi.sendMessage).mock.calls[1][0];
    expect(secondCallPayload.message).toBe('Segundo mensaje');
    // Debe excluir 'greeting-msg'
    expect(secondCallPayload.history?.some((h) => h.content.includes('Soy el Asistente Inteligente'))).toBe(false);
  });

  it('no envía el mensaje a la API si el usuario no está autenticado', async () => {
    const unauthenticatedWrapper = createWrapper({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useAiChat(), { wrapper: unauthenticatedWrapper });

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      result.current.sendMessage('Intento sin auth');
    });

    expect(aiAssistantApi.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('greeting-msg');
  });

  it('no sobrescribe el historial previo del usuario autenticado durante la transición de sesión (BUG-02)', async () => {
    // 1. Pre-poblar el historial del usuario
    const userSavedMessages = [
      { id: 'u1', role: 'user', content: 'Pregunta guardada del usuario', timestamp: '2026-09-08T10:00:00Z' },
      { id: 'u2', role: 'assistant', content: 'Respuesta guardada del usuario', timestamp: '2026-09-08T10:00:05Z' },
    ];
    localStorage.setItem('colivi_ai_chat_user-123', JSON.stringify(userSavedMessages));

    // 2. Renderizar inicialmente como usuario anónimo (sin sesión)
    let authContextValue: AuthContextType = {
      ...mockAuthContext,
      user: null,
      token: null,
      isAuthenticated: false,
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const DynamicWrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={authContextValue}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthContext.Provider>
    );

    const { result, rerender } = renderHook(() => useAiChat(), { wrapper: DynamicWrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.messages[0].id).toBe('greeting-msg');

    // 3. Simular que el contexto de autenticación carga al usuario
    authContextValue = {
      ...mockAuthContext,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        nickname: 'testuser',
        firstName: 'Test',
        lastName1: 'User',
        lastName2: null,
        phone: null,
        role: 'USER',
        profilePicUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
    };

    rerender();

    // 4. Verificar que se cargaron los mensajes del usuario y no se sobrescribieron con los anónimos
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Pregunta guardada del usuario');
    });

    const storedInLocal = JSON.parse(localStorage.getItem('colivi_ai_chat_user-123') || '[]');
    expect(storedInLocal).toHaveLength(2);
    expect(storedInLocal[0].content).toBe('Pregunta guardada del usuario');
  });

  it('sincroniza el historial cuando otra pestaña emite un evento de storage (F-23)', async () => {
    const { result } = renderHook(() => useAiChat(), { wrapper: createWrapper() });

    const externalTabMessages = [
      { id: 'ext-1', role: 'user', content: 'Mensaje desde otra pestaña', timestamp: '2026-09-11T12:00:00Z' },
      { id: 'ext-2', role: 'assistant', content: 'Respuesta en otra pestaña', timestamp: '2026-09-11T12:00:05Z' },
    ];

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'colivi_ai_chat_user-123',
          newValue: JSON.stringify(externalTabMessages),
        })
      );
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Mensaje desde otra pestaña');
    expect(result.current.messages[1].content).toBe('Respuesta en otra pestaña');
  });
});

