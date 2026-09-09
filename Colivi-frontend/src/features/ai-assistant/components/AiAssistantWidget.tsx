import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { AiChatWindow } from './AiChatWindow';

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!hasInteracted) setHasInteracted(true);
  };

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <aside
      aria-label="Asistente de inteligencia artificial de Colivi"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      {/* Ventana Flotante / Side-Panel del Asistente */}
      {isOpen && (
        <div
          className="pointer-events-auto mb-4 w-[420px] h-[620px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-modal="false"
          aria-label="Panel conversacional con IA"
        >
          <AiChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Botón de Activación Flotante (FAB) */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Tooltip / Píldora de sugerencia para la primera interacción */}
        {!isOpen && !hasInteracted && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface border border-outline-variant/60 shadow-md text-xs font-medium animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>¿Dudas sobre habitaciones o tareas? Pregunta a la IA</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleOpen}
          aria-label={isOpen ? 'Minimizar asistente' : 'Abrir Asistente Colivi IA'}
          title={isOpen ? 'Minimizar asistente' : 'Abrir Asistente Colivi IA'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`group flex items-center justify-center rounded-full shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 ${
            isOpen
              ? 'w-12 h-12 bg-surface-container-high text-on-surface border border-outline-variant/60 hover:bg-surface-container-highest'
              : 'h-14 px-5 bg-primary text-on-primary hover:bg-primary-container hover:scale-105 gap-2.5'
          }`}
        >
          {isOpen ? (
            <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
          ) : (
            <>
              <div className="relative">
                <Sparkles className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-tertiary animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-tertiary" />
              </div>
              <span className="text-sm font-semibold tracking-wide hidden sm:inline">
                Copiloto IA
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
