import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AdminUserProfile } from '../../types/admin.types';
import { CopyIdButton } from '../common/CopyIdButton';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Ban,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface AdminUserDetailModalProps {
  user: AdminUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBanModal: (user: AdminUserProfile) => void;
  onUnbanUser: (userId: string) => Promise<void>;
  onSetAdmin: (userId: string) => Promise<void>;
  onHardDeleteUser: (userId: string) => Promise<void>;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenBanModal,
  onUnbanUser,
  onSetAdmin,
  onHardDeleteUser,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'SET_ADMIN' | 'HARD_DELETE' | 'UNBAN';
    title: string;
    message: string;
    confirmText: string;
    variant: 'info' | 'danger' | 'warning';
  } | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing && !confirmModal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, confirmModal, onClose]);

  if (!isOpen || !user || typeof document === 'undefined') return null;

  const handleOpenUnbanConfirm = () => {
    setConfirmModal({
      type: 'UNBAN',
      title: `¿Desbanear a @${user.nickname}?`,
      message: 'Esta acción levantará la suspensión del usuario, permitiéndole volver a iniciar sesión y operar en la plataforma.',
      confirmText: 'Sí, desbanear usuario',
      variant: 'warning',
    });
  };

  const handleOpenSetAdminConfirm = () => {
    setConfirmModal({
      type: 'SET_ADMIN',
      title: `¿Promover a Administrador a @${user.nickname}?`,
      message: 'Este usuario tendrá acceso total a las funciones de moderación y auditoría de la plataforma.',
      confirmText: 'Sí, otorgar rol ADMIN',
      variant: 'info',
    });
  };

  const handleOpenHardDeleteConfirm = () => {
    setConfirmModal({
      type: 'HARD_DELETE',
      title: `¿Eliminar permanentemente a @${user.nickname}?`,
      message: '¡PELIGRO! Esta acción ejecutará un borrado físico (Hard Delete) irreversible eliminando al usuario y todas sus relaciones.',
      confirmText: 'Sí, eliminar usuario definitivamente',
      variant: 'danger',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      if (confirmModal.type === 'SET_ADMIN') {
        await onSetAdmin(user.id);
        setFeedback({ type: 'success', message: 'Privilegios de ADMIN otorgados con éxito.' });
        setConfirmModal(null);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDeleteUser(user.id);
        setConfirmModal(null);
        onClose();
      } else if (confirmModal.type === 'UNBAN') {
        await onUnbanUser(user.id);
        setFeedback({ type: 'success', message: 'Usuario desbaneado correctamente.' });
        setConfirmModal(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al ejecutar la acción.' });
      setConfirmModal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const isBanned = !!user.bannedAt;
  const isDeleted = !!user.deletedAt;

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={() => !isProcessing && onClose()}
      >
        <div
          className="w-full max-w-xl max-h-[90vh] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Fijo) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <User size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-on-surface">Expediente de Usuario</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                    isBanned ? 'bg-error-container text-error' :
                    isDeleted ? 'bg-surface-container text-secondary' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isBanned ? 'Baneado' : isDeleted ? 'Eliminado' : 'Activo'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    user.role === 'ADMIN' ? 'bg-error-container text-error border border-error/20' : 'bg-surface-container text-secondary'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="mt-0.5">
                  <CopyIdButton id={user.id} prefix="ID:" />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback alert */}
          {feedback && (
            <div className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-error-container text-on-error-container border-error/20'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-error shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Body (Scrollable) */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* User Hero card */}
            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/50">
              {user.profilePicUrl ? (
                <img
                  src={user.profilePicUrl}
                  alt={user.nickname}
                  className="w-16 h-16 rounded-full object-cover border-2 border-surface-container-lowest shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {user.nickname?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-base font-bold text-on-surface truncate">
                  {user.firstName} {user.lastName1} {user.lastName2 || ''}
                </h4>
                <p className="text-xs font-semibold text-primary">@{user.nickname}</p>
                <p className="text-xs text-secondary mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Detailed User Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex items-center gap-2.5">
                <Mail size={16} className="text-secondary shrink-0" />
                <div className="min-w-0">
                  <span className="text-secondary block text-[11px]">Email</span>
                  <span className="font-semibold text-on-surface truncate block">{user.email}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex items-center gap-2.5">
                <Phone size={16} className="text-secondary shrink-0" />
                <div className="min-w-0">
                  <span className="text-secondary block text-[11px]">Teléfono</span>
                  <span className="font-semibold text-on-surface block">{user.phone || 'No registrado'}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex items-center gap-2.5">
                <Shield size={16} className="text-secondary shrink-0" />
                <div className="min-w-0">
                  <span className="text-secondary block text-[11px]">Rol en Sistema</span>
                  <span className="font-semibold text-on-surface block">{user.role}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex items-center gap-2.5">
                <Calendar size={16} className="text-secondary shrink-0" />
                <div className="min-w-0">
                  <span className="text-secondary block text-[11px]">Fecha de Alta</span>
                  <span className="font-semibold text-on-surface block">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            {/* Ban info banner if user is currently banned */}
            {isBanned && (
              <div className="p-4 bg-error-container/40 border border-error/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-error">
                  <Ban size={15} />
                  <span>Usuario actualmente sancionado / baneado</span>
                </div>
                <p className="text-xs text-on-error-container font-medium">
                  <strong>Motivo:</strong> {user.banReason || 'Infracción de términos y condiciones.'}
                </p>
                {user.bannedUntil && (
                  <p className="text-[11px] text-error">
                    Baneado hasta: {new Date(user.bannedUntil).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer (Fijo) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant bg-surface shrink-0">
            <span className="text-xs text-secondary font-medium">Acciones de administración:</span>
            <div className="flex items-center gap-2">
              {isBanned ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenUnbanConfirm}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Desbanear</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onOpenBanModal(user)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Ban size={14} />
                  <span>Banear Usuario</span>
                </button>
              )}

              {user.role !== 'ADMIN' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenSetAdminConfirm}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-tertiary hover:bg-tertiary/90 text-on-tertiary rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <ShieldCheck size={14} />
                  <span>Hacer Admin</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleOpenHardDeleteConfirm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-error hover:bg-error/90 text-on-error rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Trash2 size={14} />
                <span>Borrado Físico</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <AdminConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={isProcessing}
          onConfirm={handleConfirmAction}
          onClose={() => !isProcessing && setConfirmModal(null)}
        />
      )}
    </>,
    document.body
  );
};
