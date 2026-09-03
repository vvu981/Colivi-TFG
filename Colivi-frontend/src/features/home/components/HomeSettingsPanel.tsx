import React, { useState } from 'react';
import type { HomeDetailResponseDto } from '../types';
import { RefreshCw, Trash2, ShieldAlert, AlertTriangle, Check, Copy, Loader2 } from 'lucide-react';

interface HomeSettingsPanelProps {
  home: HomeDetailResponseDto;
  isSoleActiveMember: boolean;
  onRegenerateCode: () => Promise<string>;
  onOpenDeleteModal: () => void;
  onOpenTransferAdminModal: () => void;
}

export const HomeSettingsPanel: React.FC<HomeSettingsPanelProps> = ({
  home,
  isSoleActiveMember,
  onRegenerateCode,
  onOpenDeleteModal,
  onOpenTransferAdminModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const handleCopy = () => {
    if (home.invitationCode) {
      navigator.clipboard.writeText(home.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateCode();
      setShowRegenConfirm(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Gestión del Código de Invitación */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6">
        <h3 className="text-base font-bold text-on-surface mb-1">
          Código de Invitación del Hogar
        </h3>
        <p className="text-xs text-secondary mb-4">
          Este código permite a cualquier usuario registrado unirse a tu hogar como miembro.
        </p>

        <div className="flex items-center gap-3 bg-surface border border-outline-variant p-4 rounded-xl mb-4">
          <span className="font-mono text-xl font-bold tracking-widest text-primary flex-1 select-all">
            {home.invitationCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-semibold text-on-surface transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {!showRegenConfirm ? (
          <button
            type="button"
            onClick={() => setShowRegenConfirm(true)}
            className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerar código de invitación</span>
          </button>
        ) : (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                ¿Estás seguro de que deseas regenerar el código? El código actual dejará de funcionar inmediatamente.
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRegenConfirm(false)}
                disabled={isRegenerating}
                className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                {isRegenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Regeneración</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delegación de Administración */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6">
        <h3 className="text-base font-bold text-on-surface mb-1">
          Delegar Administración
        </h3>
        <p className="text-xs text-secondary mb-4">
          Transfiere el control del hogar a otro miembro activo del grupo.
        </p>
        <button
          type="button"
          onClick={onOpenTransferAdminModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold rounded-xl transition-colors"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Transferir Rol de Administrador</span>
        </button>
      </div>

      {/* Zona de Peligro: Eliminación de Hogar */}
      <div className="bg-surface-container-lowest border border-error/20 rounded-2xl p-6">
        <h3 className="text-base font-bold text-error mb-1">
          Zona de Peligro
        </h3>
        <p className="text-xs text-secondary mb-4">
          {isSoleActiveMember
            ? 'Como eres el único miembro activo, puedes eliminar este hogar definitivamente.'
            : 'Para poder eliminar el hogar, primero deben salir o ser gestionados el resto de miembros activos.'}
        </p>

        <button
          type="button"
          onClick={onOpenDeleteModal}
          disabled={!isSoleActiveMember}
          className="flex items-center gap-2 px-4 py-2.5 bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 rounded-xl text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar este Hogar</span>
        </button>
      </div>
    </div>
  );
};
