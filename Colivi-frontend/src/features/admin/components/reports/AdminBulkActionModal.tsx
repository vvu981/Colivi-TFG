import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReportStatus } from '../../types/admin.types';
import { Select } from '../../../../components/ui/Select';
import { Layers, X, AlertTriangle } from 'lucide-react';

interface AdminBulkActionModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (status: ReportStatus, adminNotes: string) => Promise<void>;
}

export const AdminBulkActionModal: React.FC<AdminBulkActionModalProps> = ({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
}) => {
  const [status, setStatus] = useState<ReportStatus>('INVESTIGATING');
  const [adminNotes, setAdminNotes] = useState<string>('');
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

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(status, adminNotes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar denuncias masivamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fijo) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Moderación Masiva</h3>
              <p className="text-xs text-secondary">{selectedCount} denuncias seleccionadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-xs rounded-xl border border-error/20 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-error" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">Nuevo Estado</label>
            <Select
              value={status}
              onChange={(val) => setStatus(val as ReportStatus)}
              options={[
                { value: 'INVESTIGATING', label: 'En Investigación (INVESTIGATING)' },
                { value: 'RESOLVED', label: 'Resuelta (RESOLVED)' },
                { value: 'DISMISSED', label: 'Desestimada (DISMISSED)' },
              ]}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface">Notas Administrativas</label>
            <textarea
              rows={3}
              placeholder="Notas u observaciones aplicables a todo el lote..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-container text-on-primary rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Aplicando...' : 'Aplicar a Selección'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
