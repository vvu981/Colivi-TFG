import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flag,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import {
  LISTING_REPORT_REASONS,
  type ReportReason,
} from '../types/report.types';

export interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle?: string;
  onSuccess?: () => void;
}

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  isOpen,
  onClose,
  listingId,
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
    if (!selectedReason) {
      setErrorMessage('Por favor, selecciona un motivo para la denuncia.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reportService.createReport({
        targetType: 'LISTING',
        targetId: listingId,
        reason: selectedReason,
        description: description.trim() ? description.trim() : undefined,
      });

      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Ocurrió un error al enviar la denuncia. Por favor, inténtalo de nuevo.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-[min(36rem,calc(100vw-2rem))] max-h-[90vh] bg-white rounded-3xl border border-[#dec0b7]/60 p-6 md:p-7 shadow-2xl flex flex-col gap-5 overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffdbcf]/60 text-[#9f3c16] flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-lg font-bold text-on-surface">
                Denunciar anuncio
              </h2>
              <p className="text-xs text-[#565e74] mt-0.5">
                Ayúdanos a mantener Colivi seguro y transparente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            className="text-[#565e74] hover:text-[#0b1c30] p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Confirmation View */}
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-in zoom-in-75 duration-200">
              <CheckCircle2 size={36} />
            </div>
            <div className="flex flex-col gap-1.5 max-w-sm">
              <h3 className="text-lg font-bold text-on-surface">
                Denuncia enviada correctamente
              </h3>
              <p className="text-xs text-[#565e74] leading-relaxed">
                Gracias por contribuir a la seguridad de la comunidad. Nuestro equipo de moderación revisará este anuncio según nuestras políticas de convivencia.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-xl bg-[#9f3c16] text-white font-semibold text-sm hover:bg-[#bf542c] transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : (
          /* Report Form View */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {listingTitle && (
              <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <Flag size={16} className="text-[#9f3c16] flex-shrink-0" />
                <span className="text-xs text-[#565e74] font-medium truncate">
                  Anuncio: <strong className="text-[#0b1c30]">{listingTitle}</strong>
                </span>
              </div>
            )}

            {/* Motivos */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                ¿Cuál es el motivo de tu denuncia? <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col gap-2 mt-1">
                {LISTING_REPORT_REASONS.map((option) => {
                  const isChecked = selectedReason === option.reason;
                  return (
                    <label
                      key={option.reason}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#9f3c16] bg-[#ffdbcf]/20 shadow-xs ring-1 ring-[#9f3c16]/30'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={option.reason}
                        checked={isChecked}
                        onChange={() => setSelectedReason(option.reason)}
                        className="mt-1 text-[#9f3c16] focus:ring-[#9f3c16]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-[#0b1c30]">
                          {option.label}
                        </span>
                        <span className="text-[11px] text-[#565e74] leading-normal">
                          {option.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Descripción adicional */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="report-description"
                  className="text-xs font-semibold text-[#0b1c30]"
                >
                  Detalles adicionales (opcional)
                </label>
                <span className="text-[10px] text-[#565e74]">
                  {description.length}/1000
                </span>
              </div>
              <textarea
                id="report-description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aporta cualquier información que ayude al equipo de moderación a evaluar este caso..."
                className="w-full p-3 rounded-2xl border border-slate-200 bg-white text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:border-[#9f3c16] focus:ring-2 focus:ring-[#9f3c16]/20 resize-none"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#565e74] hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="px-5 py-2.5 rounded-xl bg-[#9f3c16] text-white text-xs font-bold hover:bg-[#bf542c] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Enviando denuncia...</span>
                  </>
                ) : (
                  <>
                    <Flag size={14} />
                    <span>Enviar denuncia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
