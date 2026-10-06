import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flag,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import {
  CONVERSATION_REPORT_REASONS,
  type ReportReason,
} from '../types/report.types';

export interface ReportConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  interlocutorName?: string;
  listingTitle?: string;
  onSuccess?: () => void;
}

/**
 * Modal to report a conversation thread for moderation (Harassment, Fraud, Spam, Inappropriate content, etc.).
 * Adheres to SOLID Single Responsibility Principle.
 */
export const ReportConversationModal: React.FC<ReportConversationModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  interlocutorName,
  listingTitle,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setDescription('');
      setErrorMessage(null);
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedReason) {
      setErrorMessage('Por favor, selecciona un motivo para la denuncia.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reportService.createReport({
        targetType: 'CONVERSATION',
        targetId: conversationId,
        reason: selectedReason,
        description: description.trim() ? description.trim() : undefined,
      });

      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo enviar la denuncia. Por favor, inténtalo de nuevo.';
      setErrorMessage(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-conversation-modal-title"
    >
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-outline-variant overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/60 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container/40 text-error flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="report-conversation-modal-title"
                className="text-base font-bold text-on-surface"
              >
                Denunciar Conversación
              </h3>
              <p className="text-xs text-secondary">
                {interlocutorName ? `Chat con ${interlocutorName}` : 'Conversación de consulta'}
                {listingTitle ? ` • ${listingTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-secondary hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-on-surface mb-2">
                Denuncia registrada
              </h4>
              <p className="text-sm text-secondary max-w-sm mx-auto mb-6">
                Gracias por avisarnos. El equipo de administración revisará el hilo completo
                de mensajes para determinar las medidas oportunas de moderación.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary font-medium text-sm rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
              >
                Entendido
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-secondary leading-relaxed">
                  Al denunciar, el equipo de administración podrá inspeccionar la transcripción
                  íntegra de los mensajes de esta conversación para verificar la infracción.
                </p>
              </div>

              {errorMessage && (
                <div
                  className="p-3 bg-error-container/40 border border-error/30 rounded-xl text-error text-xs flex items-start gap-2"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Motivo de la denuncia <span className="text-error">*</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {CONVERSATION_REPORT_REASONS.map((option) => (
                    <label
                      key={option.reason}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedReason === option.reason
                          ? 'border-primary bg-primary/5 text-on-surface shadow-xs'
                          : 'border-outline-variant hover:border-outline hover:bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="conversation-report-reason"
                        value={option.reason}
                        checked={selectedReason === option.reason}
                        onChange={() => {
                          setSelectedReason(option.reason);
                          setErrorMessage(null);
                        }}
                        className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold">
                          {option.label}
                        </span>
                        <span className="block text-[11px] text-secondary mt-0.5 leading-snug">
                          {option.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Descripción opcional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="conversation-report-description"
                    className="block text-xs font-semibold text-on-surface"
                  >
                    Detalles adicionales (opcional)
                  </label>
                  <span className="text-[11px] text-secondary">
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  id="conversation-report-description"
                  rows={3}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explica qué ha sucedido o qué mensajes específicos motivan la denuncia..."
                  className="w-full text-xs p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden text-on-surface placeholder:text-secondary/60 resize-none"
                />
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-on-primary bg-error hover:opacity-90 active:opacity-100 rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-3.5 h-3.5" />
                      <span>Enviar denuncia</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
