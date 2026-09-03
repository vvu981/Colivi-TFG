import React, { useState, useEffect } from 'react';
import { UserPlus, X, Copy, Check, Share2, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  invitationCode?: string | null;
  isAdmin: boolean;
  onRegenerateCode?: () => Promise<string>;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  homeName,
  invitationCode,
  isAdmin,
  onRegenerateCode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [currentCode, setCurrentCode] = useState(invitationCode ?? '');

  useEffect(() => {
    setCurrentCode(invitationCode ?? '');
  }, [invitationCode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRegenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRegenerating, onClose]);

  if (!isOpen) return null;

  const invitationMessage = `¡Hola! Únete a nuestro hogar "${homeName}" en Colivi usando este código de invitación: ${currentCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(invitationMessage)}`;
    window.open(url, '_blank');
  };

  const handleRegenerate = async () => {
    if (!onRegenerateCode) return;
    setIsRegenerating(true);
    try {
      const newCode = await onRegenerateCode();
      setCurrentCode(newCode);
      setShowRegenConfirm(false);
    } catch {
      // Error manejado
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-lg w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 id="invite-modal-title" className="text-lg font-bold text-on-surface">Invitar a {homeName}</h2>
            <p className="text-xs text-secondary">Comparte el código con tus futuros compañeros.</p>
          </div>
        </div>

        {/* Display del Código */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 mb-5 text-center">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
            Código de Invitación
          </span>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-primary tracking-widest bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 select-all">
              {currentCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copiar código"
              className="p-3 bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface rounded-xl border border-outline-variant transition-colors"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-secondary mt-2">
            Cualquier usuario registrado podrá unirse introduciendo este código.
          </p>
        </div>

        {/* Opciones para compartir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            {copiedMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-secondary" />}
            <span>Copiar mensaje completo</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir por WhatsApp</span>
          </button>
        </div>

        {/* Zona de Administrador: Regenerar Código */}
        {isAdmin && onRegenerateCode && (
          <div className="pt-4 border-t border-outline-variant/40">
            {!showRegenConfirm ? (
              <button
                type="button"
                onClick={() => setShowRegenConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>¿Necesitas invalidar el código actual y generar uno nuevo?</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-2 text-amber-800 text-xs mb-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    El código actual quedará invalidado de inmediato. Cualquier persona con el código anterior ya no podrá unirse.
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegenConfirm(false)}
                    disabled={isRegenerating}
                    className="px-3 py-1 text-xs font-medium text-secondary hover:text-on-surface"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    {isRegenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Confirmar regeneración</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
