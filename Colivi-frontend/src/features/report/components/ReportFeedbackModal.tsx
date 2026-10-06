import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, Check } from 'lucide-react';
import type { ReportFeedbackResponse } from '../types/report.types';

export interface ReportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: ReportFeedbackResponse | null;
}

export const ReportFeedbackModal: React.FC<ReportFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedback,
}) => {
  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !feedback || typeof document === 'undefined') return null;

  const targetLabel =
    feedback.targetType === 'LISTING' ? 'el anuncio' : 'el usuario';

  const REASON_LABELS: Record<string, string> = {
    FRAUD: 'fraude',
    SPAM: 'spam',
    HARASSMENT: 'acoso',
    INAPPROPRIATE_CONTENT: 'contenido inapropiado',
    OTHER: 'infracciones de normas',
  };

  const reasonLabel = REASON_LABELS[feedback.reason] || feedback.reason.toLowerCase();


  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-feedback-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-outline-variant/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="report-feedback-modal-title"
                className="text-lg font-bold text-on-surface"
              >
                Denuncia revisada y resuelta
              </h2>
              <p className="text-xs text-on-surface-variant">
                Actualización del equipo de moderación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-sm text-on-surface leading-relaxed">
              Queremos agradecerte tu compromiso con la seguridad de la comunidad.
              El equipo de moderación ha investigado {targetLabel} que denunciaste por{' '}
              <span className="font-semibold text-primary">
                {reasonLabel}
              </span>{' '}
              y ha tomado las medidas disciplinarias y de protección pertinentes.
            </p>
          </div>


          <p className="text-xs text-on-surface-variant text-center">
            Gracias a usuarios como tú, Colivi sigue siendo un espacio seguro y confiable para todos.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-surface-variant/30 border-t border-outline-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Check className="w-4 h-4" />
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
