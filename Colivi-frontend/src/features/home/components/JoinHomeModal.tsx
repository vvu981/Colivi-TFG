import React, { useState } from 'react';
import { KeyRound, X, Loader2 } from 'lucide-react';
import type { JoinHomeRequest } from '../types';

interface JoinHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JoinHomeRequest) => Promise<void>;
}

export const JoinHomeModal: React.FC<JoinHomeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Introduce un código de invitación.');
      return;
    }
    if (trimmed.length < 8 || trimmed.length > 50) {
      setError('El código de invitación debe tener entre 8 y 50 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ invitationCode: trimmed });
      setCode('');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Código inválido o error al unirse al hogar.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Unirse a un Hogar</h2>
            <p className="text-xs text-secondary">Introduce el código compartido por tu compañero.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invitationCode" className="block text-xs font-semibold text-on-surface mb-1.5">
              Código de Invitación <span className="text-primary">*</span>
            </label>
            <input
              id="invitationCode"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="Ej: ABC123XYZ"
              maxLength={50}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-mono tracking-wider text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
              autoFocus
            />
            <p className="text-[11px] text-secondary mt-1">
              Pídele el código al administrador de tu piso para acceder.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Unirme</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
