import React, { useState } from 'react';
import type { AdminUserProfile, BanUserRequest, PageResponse } from '../../types/admin.types';
import { AdminUserDetailModal } from './AdminUserDetailModal';
import { AdminBanUserModal } from './AdminBanUserModal';
import { AdminUserTableRow } from './AdminUserTableRow';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import { Select } from '../../../../components/ui/Select';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';

const pageSizeOptions = [
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
  { value: '50', label: '50 por página' },
];

interface AdminUsersTableProps {
  users: AdminUserProfile[];
  pageInfo: PageResponse<AdminUserProfile> | null;
  query: string;
  role: string;
  banned: boolean | undefined;
  deleted: boolean | undefined;
  page: number;
  size: number;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onRoleChange: (role: string) => void;
  onBannedChange: (banned: boolean | undefined) => void;
  onDeletedChange: (deleted: boolean | undefined) => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onBanUser: (userId: string, payload: BanUserRequest) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  onHardDeleteUser: (userId: string) => Promise<void>;
  onSetAdmin: (userId: string) => Promise<void>;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  pageInfo,
  query,
  role,
  banned,
  deleted,
  page,
  size,
  isLoading,
  onQueryChange,
  onRoleChange,
  onBannedChange,
  onDeletedChange,
  onPageChange,
  onSizeChange,
  onBanUser,
  onUnbanUser,
  onHardDeleteUser,
  onSetAdmin,
}) => {
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserProfile | null>(null);
  const [selectedUserForBan, setSelectedUserForBan] = useState<AdminUserProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'SET_ADMIN' | 'HARD_DELETE' | 'UNBAN';
    userId: string;
    nickname: string;
    title: string;
    message: string;
    confirmText: string;
    variant: 'info' | 'danger' | 'warning';
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const handleOpenPromoteConfirm = (user: AdminUserProfile) => {
    setActionError(null);
    setConfirmModal({
      type: 'SET_ADMIN',
      userId: user.id,
      nickname: user.nickname,
      title: `¿Promover a Administrador a @${user.nickname}?`,
      message: 'Este usuario tendrá acceso total a las funciones de moderación y auditoría de la plataforma.',
      confirmText: 'Sí, otorgar rol ADMIN',
      variant: 'info',
    });
  };

  const handleOpenUnbanConfirm = (user: AdminUserProfile) => {
    setActionError(null);
    setConfirmModal({
      type: 'UNBAN',
      userId: user.id,
      nickname: user.nickname,
      title: `¿Desbanear a @${user.nickname}?`,
      message: 'Esta acción levantará la suspensión del usuario, permitiéndole volver a iniciar sesión y operar en la plataforma.',
      confirmText: 'Sí, desbanear usuario',
      variant: 'warning',
    });
  };

  const handleOpenHardDeleteConfirm = (user: AdminUserProfile) => {
    setActionError(null);
    setConfirmModal({
      type: 'HARD_DELETE',
      userId: user.id,
      nickname: user.nickname,
      title: `¿Eliminar permanentemente a @${user.nickname}?`,
      message: '¡PELIGRO! Esta acción ejecutará un borrado físico (Hard Delete) irreversible eliminando al usuario y todas sus relaciones.',
      confirmText: 'Sí, eliminar usuario definitivamente',
      variant: 'danger',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsProcessingAction(true);
    setActionError(null);
    try {
      if (confirmModal.type === 'SET_ADMIN') {
        await onSetAdmin(confirmModal.userId);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDeleteUser(confirmModal.userId);
      } else if (confirmModal.type === 'UNBAN') {
        await onUnbanUser(confirmModal.userId);
      }
      setConfirmModal(null);
    } catch (err: any) {
      setActionError(err.message || 'Error al ejecutar la acción sobre el usuario.');
      setConfirmModal(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 bg-error-container text-on-error-container text-xs rounded-xl border border-error/20 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-error" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-3">
          <Filter size={16} className="text-primary" />
          <span>Filtros de Usuarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Buscar usuario</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ID, email, nickname o nombre..."
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-secondary" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Rol</label>
            <Select
              value={role}
              onChange={(val) => onRoleChange(val)}
              options={[
                { value: '', label: 'Todos los roles' },
                { value: 'USER', label: 'USER' },
                { value: 'ADMIN', label: 'ADMIN' },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          {/* Banned */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Estado de Baneo</label>
            <Select
              value={banned === undefined ? '' : String(banned)}
              onChange={(val) => onBannedChange(val === '' ? undefined : val === 'true')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Solo Baneados' },
                { value: 'false', label: 'No Baneados' },
              ]}
              className="text-xs py-1.5"
            />
          </div>

          {/* Deleted */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Estado de Cuenta</label>
            <Select
              value={deleted === undefined ? '' : String(deleted)}
              onChange={(val) => onDeletedChange(val === '' ? undefined : val === 'true')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'false', label: 'Solo Cuentas Activas' },
                { value: 'true', label: 'Solo Eliminadas' },
              ]}
              className="text-xs py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-secondary uppercase text-[11px] font-bold border-b border-outline-variant tracking-wider">
              <tr>
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5">Contacto</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Registro</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-secondary">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando directorio de usuarios...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-secondary">
                    <Users size={32} className="mx-auto text-secondary/40 mb-2" />
                    <p className="text-sm font-semibold text-on-surface">No se encontraron usuarios</p>
                    <p className="text-xs text-secondary mt-0.5">Prueba con otro término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <AdminUserTableRow
                    key={item.id}
                    item={item}
                    onSelectUserForDetail={setSelectedUserForDetail}
                    onSelectUserForBan={setSelectedUserForBan}
                    onOpenUnbanConfirm={handleOpenUnbanConfirm}
                    onOpenPromoteConfirm={handleOpenPromoteConfirm}
                    onOpenHardDeleteConfirm={handleOpenHardDeleteConfirm}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageInfo && pageInfo.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-outline-variant bg-surface text-xs text-secondary">
            <div className="flex items-center gap-2">
              <span>Mostrar</span>
              <div className="w-36">
                <Select
                  value={String(size)}
                  onChange={(val) => onSizeChange(Number(val))}
                  options={pageSizeOptions}
                  direction="up"
                  className="text-xs py-1"
                />
              </div>
              <span>• Total: {pageInfo.totalElements} usuarios</span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Página <strong className="text-on-surface">{page + 1}</strong> de {pageInfo.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                  className="p-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pageInfo.totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  className="p-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AdminUserDetailModal
        user={selectedUserForDetail}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
        onOpenBanModal={(user) => {
          setSelectedUserForDetail(null);
          setSelectedUserForBan(user);
        }}
        onUnbanUser={onUnbanUser}
        onHardDeleteUser={onHardDeleteUser}
        onSetAdmin={onSetAdmin}
      />

      {/* Ban User Modal */}
      <AdminBanUserModal
        user={selectedUserForBan}
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        onConfirmBan={onBanUser}
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <AdminConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
          isLoading={isProcessingAction}
          onConfirm={handleConfirmAction}
          onClose={() => !isProcessingAction && setConfirmModal(null)}
        />
      )}
    </div>
  );
};
