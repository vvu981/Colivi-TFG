import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndex = "z-[60]" }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150`}>
      <div className="bg-surface w-full max-w-[450px] min-w-[300px] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-surface-container flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
