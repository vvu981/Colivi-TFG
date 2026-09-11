import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, FileText } from 'lucide-react';
import type { AiChatMessage } from '../types';

interface AiMessageBubbleProps {
  message: AiChatMessage;
}

export const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopyDraft = (textToCopy: string) => {
    // ROB-02: Manejo seguro ante navegadores o contextos restringidos que rechacen el portapapeles
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn('No se pudo copiar el texto al portapapeles:', err);
        });
    }
  };

  return (
    <div
      className={`flex w-full gap-3 ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Icono de Avatar del Asistente */}
      {isAssistant && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
          aria-hidden="true"
        >
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Burbuja Principal */}
      <div
        className={`flex flex-col text-sm ${
          isAssistant
            ? 'max-w-[88%] bg-surface-container-low text-on-surface border border-outline-variant/40 rounded-2xl rounded-tl-xs p-4 shadow-xs'
            : 'max-w-[82%] bg-primary text-on-primary rounded-2xl rounded-tr-xs p-3.5 shadow-xs'
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none text-on-surface space-y-2 leading-relaxed break-words">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-on-surface">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium underline hover:text-primary-container"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-xs font-mono text-on-surface">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-3 my-2 italic text-on-surface-variant">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Módulo de Borrador de Mensaje (Human-in-the-loop) */}
            {message.draftContent && message.draftContent.trim().length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-outline-variant/40">
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Borrador sugerido para enviar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyDraft(message.draftContent!.trim())}
                      aria-label="Copiar texto al portapapeles"
                      title="Copiar texto al portapapeles"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary font-medium">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-secondary" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/20 whitespace-pre-wrap leading-relaxed select-all">
                    {message.draftContent}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed break-words text-on-primary">
            {message.content}
          </p>
        )}

        {/* Timestamp */}
        <span
          className={`text-[10px] mt-1.5 self-end ${
            isAssistant ? 'text-secondary' : 'text-on-primary/80'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Icono de Usuario */}
      {!isAssistant && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container"
          aria-hidden="true"
        >
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
