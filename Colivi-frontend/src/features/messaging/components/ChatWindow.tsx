import React, { useState, useRef, useEffect } from 'react';
import type { Message, ConversationSummary } from '../types';

interface ChatWindowProps {
  conversation: ConversationSummary;
  messages: Message[];
  onSendMessage: (content: string) => Promise<unknown> | void;
  onRequestBooking: () => void;
  isSending?: boolean;
  isReadOnly?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onRequestBooking,
  isSending = false,
  isReadOnly = false,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const previousScrollHeightRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  // ─── Control de Scroll Inteligente y Carga al Subir ───────────────────────
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = isNearBottom;
    setShowScrollBottomBtn(!isNearBottom);

    // Scroll infinito automático al llegar arriba
    if (container.scrollTop < 40 && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      previousScrollHeightRef.current = container.scrollHeight;
      fetchNextPage();
    }
  };

  // ─── Ajuste de Scroll al cambiar mensajes ─────────────────────────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Caso 1: Se cargaron páginas de historial previas (prepending).
    // Compensamos el scroll para que el usuario no sienta ningún salto.
    if (previousScrollHeightRef.current > 0) {
      const addedHeight = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop += addedHeight;
      previousScrollHeightRef.current = 0;
      return;
    }

    // Caso 2: Carga inicial o el usuario está leyendo los mensajes recientes.
    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      if (messages.length > 0) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    // Caso 3: Si el usuario está al fondo, acompaña suavemente al nuevo mensaje.
    // Si está leyendo historial arriba, NO lo empuja hacia abajo.
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || isReadOnly) return;
    const textToSend = inputText.trim();
    setInputText('');

    // Al enviar nuestro propio mensaje, forzamos la vista al fondo
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);

    setErrorMessage(null);
    try {
      await onSendMessage(textToSend);
    } catch (err: unknown) {
      setInputText(textToSend);
      const msg = err instanceof Error ? err.message : 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
      setErrorMessage(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* ─── Historial de Mensajes con Scroll Protegido ──────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {/* Trigger de Cargar Más Mensajes Antiguos */}
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) previousScrollHeightRef.current = container.scrollHeight;
                if (fetchNextPage) fetchNextPage();
              }}
              disabled={isFetchingNextPage}
              className="text-xs text-primary hover:underline flex items-center gap-1.5 py-1 px-3 rounded-full bg-surface-container border border-outline-variant transition-colors disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Cargando mensajes anteriores...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  <span>Cargar mensajes anteriores</span>
                </>
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-on-surface">Canal de Consulta Abierto</p>
            <p className="text-xs text-on-surface-variant mt-1">Escribe tu primera pregunta para resolver dudas sobre el alojamiento.</p>
          </div>
        ) : (
          messages.map((message) => {
            // Renderizado Especial: Nudge del Sistema
            if (message.messageType === 'SYSTEM_MESSAGE') {
              return (
                <div key={message.id} className="my-6 flex justify-center">
                  <div className="max-w-md w-full bg-surface-container-high border border-outline-variant rounded-xl p-4 text-center ambient-shadow">
                    <div className="w-8 h-8 mx-auto rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-on-surface mb-1">
                      Aviso de la Plataforma
                    </p>
                    <p className="text-xs text-on-surface-variant mb-3">
                      {message.content}
                    </p>
                    {!conversation.isHost && (
                      <button
                        type="button"
                        onClick={onRequestBooking}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-primary bg-primary hover:opacity-90 rounded-lg shadow-xs transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Solicitar Reserva Ahora
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // Mensajes de Usuario (Inquilino / Propietario)
            const isMine = message.isMine;
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-xs transition-opacity ${
                    isMine
                      ? `bg-primary text-on-primary rounded-br-xs ${message.isPending ? 'opacity-80' : 'opacity-100'}`
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant rounded-bl-xs'
                  }`}
                >
                  {!isMine && (
                    <p className="text-[11px] font-semibold text-primary mb-0.5">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                      isMine ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                    }`}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {isMine && (
                      <span className="inline-flex items-center">
                        {message.isPending ? (
                          // Indicador Optimista "Enviando..."
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium opacity-90">
                            <span>Enviando</span>
                            <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          </span>
                        ) : message.status === 'READ' ? (
                          // Doble check leído
                          <svg className="w-3.5 h-3.5 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          // Check individual entregado/enviado
                          <svg className="w-3.5 h-3.5 text-primary-fixed-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Botón Flotante para Bajar al Fondo si el usuario leyó historial ───── */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface shadow-md hover:bg-surface-container transition-all z-10"
          aria-label="Bajar a los mensajes recientes"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </button>
      )}

      {/* ─── Barra de Entrada / Modo Solo Lectura ───────────────────────────────── */}
      <div className="p-4 bg-surface border-t border-outline-variant">
        {errorMessage && (
          <div
            role="alert"
            className="mb-3 flex items-center justify-between gap-2 p-3 text-sm text-error bg-error-container/20 border border-error/30 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-error hover:text-error/80 p-1 rounded-lg transition-colors"
              aria-label="Cerrar aviso de error"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {isReadOnly ? (
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-surface-container border border-outline-variant text-on-surface-variant text-xs">
            <svg className="w-4 h-4 text-on-surface-variant shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>
              Esta conversación está en modo solo lectura. No es posible enviar nuevos mensajes.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-7xl mx-auto">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none px-4 py-2.5 text-sm bg-surface-container-low border border-outline-variant rounded-xl focus:bg-surface-container-lowest focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent transition-all max-h-32 text-on-surface placeholder:text-on-surface-variant/60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              aria-label="Enviar mensaje"
              className="p-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 active:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0 focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
