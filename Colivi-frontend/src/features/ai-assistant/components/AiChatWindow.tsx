import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import { useAiChat } from '../hooks/useAiChat';
import { AiMessageBubble } from './AiMessageBubble';

interface AiChatWindowProps {
  onClose?: () => void;
  title?: string;
}

export const AiChatWindow: React.FC<AiChatWindowProps> = ({
  onClose,
  title = 'Copiloto Colivi IA',
}) => {
  const { messages, sendMessage, isPending, clearHistory, suggestions, isAuthenticated } = useAiChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // F-25: scrollToBottom en useCallback para que sea estable entre renders.
  // Sin esto, si se incluye como dep de un useEffect en el futuro, se crea un bucle infinito.
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isPending, scrollToBottom]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isPending || !isAuthenticated) return;

    sendMessage(inputText);
    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!isAuthenticated || isPending) return;
    sendMessage(prompt);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-ajustar altura dinámica
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-surface text-on-surface rounded-2xl shadow-xl border border-outline-variant/50 overflow-hidden">
      {/* Cabecera del Asistente */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface leading-tight">
              {title}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="text-[11px] text-secondary font-medium">
                Conectado a MCP (Solo lectura)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Limpiar conversación"
            aria-label="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Cerrar panel"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Sugerencias Rapidas Iniciales (Chips) */}
      {/* F-26: Las sugerencias se muestran mientras el usuario no haya iniciado el intercambio conversacional */}
      {isAuthenticated && !messages.some((m) => m.role === 'user') && suggestions.length > 0 && (
        <div className="px-4 py-2.5 bg-surface-container-low/70 border-b border-outline-variant/30 flex flex-wrap gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => handleSuggestionClick(item.prompt)}
              className="text-xs px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Historial de Mensajes (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <AiMessageBubble key={msg.id} message={msg} />
        ))}

        {/* Indicador de "Escribiendo..." / Procesando tools */}
        {isPending && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
            <div className="bg-surface-container-low text-on-surface border border-outline-variant/40 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs flex items-center gap-2">
              <span className="font-medium text-on-surface-variant">
                El asistente está consultando las herramientas...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Entrada de Mensaje o Invitación al Login */}
      <footer className="p-3 bg-surface-container border-t border-outline-variant/40">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center p-3 text-center space-y-2 bg-surface-container-low rounded-xl border border-outline-variant/40">
            <p className="text-xs text-on-surface-variant font-medium">
              Inicia sesión en Colivi para interactuar con el Asistente IA y consultar tus tareas o reservas.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={2000}
                placeholder="Pregunta sobre habitaciones, tareas o solicitudes..."
                className="w-full resize-none max-h-28 px-3.5 py-2.5 text-sm rounded-xl bg-surface text-on-surface border border-outline-variant placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition-all"
                disabled={isPending}
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isPending}
              className="p-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs flex-shrink-0"
              title="Enviar mensaje"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
        <p className="text-[10px] text-center text-secondary mt-2">
          Respuestas generadas con IA en modo solo lectura sobre el servidor MCP.
        </p>
      </footer>
    </div>
  );
};
