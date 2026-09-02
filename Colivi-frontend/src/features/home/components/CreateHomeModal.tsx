import React, { useState } from 'react';
import { Home, X, Loader2 } from 'lucide-react';
import type { CreateHomeRequest } from '../types';

interface CreateHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHomeRequest) => Promise<void>;
}

export const CreateHomeModal: React.FC<CreateHomeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre del hogar no puede estar vacío.');
      return;
    }
    if (trimmed.length > 255) {
      setError('El nombre no puede superar los 255 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: trimmed });
      setName('');
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear el hogar. Inténtalo de nuevo.';
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
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Crear un Nuevo Hogar</h2>
            <p className="text-xs text-secondary">Serás el administrador de este grupo.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="homeName" className="block text-xs font-semibold text-on-surface mb-1.5">
              Nombre del Hogar <span className="text-primary">*</span>
            </label>
            <input
              id="homeName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej: Piso Calle Mayor, Casa de Estudiantes..."
              maxLength={255}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
            />
            <p className="text-[11px] text-secondary mt-1">
              Podrás invitar a tus compañeros una vez creado mediante un código de invitación.
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
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Crear Hogar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
