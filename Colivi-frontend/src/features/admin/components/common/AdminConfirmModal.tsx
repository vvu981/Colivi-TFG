import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Ban, ShieldCheck, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 size={22} className="text-red-700" />,
          iconBg: 'bg-red-100',
          btnBg: 'bg-red-700 hover:bg-red-800 text-white',
        };
      case 'warning':
        return {
          icon: <Ban size={22} className="text-amber-700" />,
          iconBg: 'bg-amber-100',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'info':
        return {
          icon: <ShieldCheck size={22} className="text-purple-700" />,
          iconBg: 'bg-purple-100',
          btnBg: 'bg-purple-700 hover:bg-purple-800 text-white',
        };
      default:
        return {
          icon: <AlertTriangle size={22} className="text-[#9f3c16]" />,
          iconBg: 'bg-[#ffdbcf]',
          btnBg: 'bg-[#9f3c16] hover:bg-[#853212] text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-[#0b1c30]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#dec0b7] shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#0b1c30]">{title}</h3>
            <p className="text-xs text-[#565e74] mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#565e74] hover:text-[#0b1c30] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs ${styles.btnBg}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
