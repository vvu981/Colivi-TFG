import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Loader2, Check } from 'lucide-react';
import type { HomeMemberResponseDto } from '../types';

interface TransferAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMembers: HomeMemberResponseDto[];
  currentUserId?: string;
  onTransfer: (targetUserId: string) => Promise<void>;
}

export const TransferAdminModal: React.FC<TransferAdminModalProps> = ({
  isOpen,
  onClose,
  activeMembers,
  currentUserId,
  onTransfer,
}) => {
  // Filtrar miembros activos que no sean el usuario actual ni administradores actuales
  const eligibleMembers = activeMembers.filter(
    (m) => m.userId !== currentUserId && m.role !== 'ADMIN'
  );

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Selecciona un miembro para transferirle la administración.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onTransfer(selectedUserId);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al transferir la administración del hogar.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-admin-title"
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
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 id="transfer-admin-title" className="text-lg font-bold text-on-surface">Transferir Administración</h2>
            <p className="text-xs text-secondary">Elige quién será el nuevo administrador.</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800">
          Al transferir el rol, perderás los privilegios de administrador y pasarás a ser miembro estándar.
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium">
            {error}
          </div>
        )}

        {eligibleMembers.length === 0 ? (
          <div className="text-center py-6 text-sm text-secondary">
            No hay otros miembros activos disponibles para transferir la administración.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {eligibleMembers.map((member) => {
                const isSelected = selectedUserId === member.userId;
                return (
                  <label
                    key={member.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-on-surface'
                        : 'border-outline-variant/60 bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {member.profilePicUrl ? (
                        <img
                          src={member.profilePicUrl}
                          alt={member.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-outline-variant/60 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 ${
                          member.profilePicUrl ? 'hidden' : ''
                        }`}
                      >
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{member.fullName}</p>
                        <p className="text-xs text-secondary">{member.email}</p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="targetUser"
                      value={member.userId}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedUserId(member.userId);
                        if (error) setError(null);
                      }}
                      className="hidden"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-outline-variant'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </label>
                );
              })}
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
                disabled={isSubmitting || !selectedUserId}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Transferir Rol</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
