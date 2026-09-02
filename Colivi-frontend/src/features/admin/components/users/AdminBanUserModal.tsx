import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AdminUserProfile, BanUserRequest } from '../../types/admin.types';
import { Ban, X, AlertTriangle } from 'lucide-react';

interface AdminBanUserModalProps {
  user: AdminUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBan: (userId: string, payload: BanUserRequest) => Promise<void>;
}

export const AdminBanUserModal: React.FC<AdminBanUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirmBan,
}) => {
  const [reason, setReason] = useState<string>('');
  const [presetDuration, setPresetDuration] = useState<string>('7'); // days, or 'permanent', or 'custom'
  const [customDate, setCustomDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Debes especificar un motivo para el baneo.');
      return;
    }

    let bannedUntil: string | null = null;
    if (presetDuration === 'permanent') {
      bannedUntil = null;
    } else if (presetDuration === 'custom' && customDate) {
      bannedUntil = new Date(customDate).toISOString();
    } else if (presetDuration) {
      const days = parseInt(presetDuration, 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      bannedUntil = date.toISOString();
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmBan(user.id, {
        message: reason.trim(),
        bannedUntil,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar baneo del usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl border border-[#dec0b7] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fijo) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dec0b7] bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
              <Ban size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Banear Usuario</h3>
              <p className="text-xs text-[#565e74] mt-0.5">
                @{user.nickname} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#565e74] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0b1c30]">
              Motivo del Baneo <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explica la razón de la suspensión (p. ej. spam repetitivo, quejas de convivencia, etc.)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-white border border-[#dec0b7] rounded-xl p-3 text-[#0b1c30] focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Duración */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0b1c30]">Duración de la Suspensión</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '24 horas', val: '1' },
                { label: '3 días', val: '3' },
                { label: '7 días', val: '7' },
                { label: '30 días', val: '30' },
                { label: 'Permanente', val: 'permanent' },
                { label: 'Personalizada', val: 'custom' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.val}
                  onClick={() => setPresetDuration(p.val)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    presetDuration === p.val
                      ? 'bg-red-50 text-red-800 border-red-300 font-bold'
                      : 'bg-white text-[#565e74] border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {presetDuration === 'custom' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-[#565e74] mb-1">
                  Fecha y hora de expiración
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full text-xs bg-white border border-[#dec0b7] rounded-xl p-2.5 text-[#0b1c30]"
                />
              </div>
            )}
          </div>

          {/* Footer (Dentro del form) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-700 hover:bg-red-800 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Ban size={14} />
              <span>{isSubmitting ? 'Aplicando...' : 'Confirmar Suspensión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
