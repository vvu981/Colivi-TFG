import React, { useState } from 'react';
import type { AdminUserProfile, BanUserRequest, PageResponse } from '../../types/admin.types';
import { AdminUserDetailModal } from './AdminUserDetailModal';
import { AdminBanUserModal } from './AdminBanUserModal';
import { CopyIdButton } from '../common/CopyIdButton';
import { AdminConfirmModal } from '../common/AdminConfirmModal';
import { Select } from '../../../../components/ui/Select';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Filter,
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
    try {
      if (confirmModal.type === 'SET_ADMIN') {
        await onSetAdmin(confirmModal.userId);
      } else if (confirmModal.type === 'HARD_DELETE') {
        await onHardDeleteUser(confirmModal.userId);
      } else if (confirmModal.type === 'UNBAN') {
        await onUnbanUser(confirmModal.userId);
      }
      setConfirmModal(null);
    } catch (err) {
      console.error('Error executing user action:', err);
      setConfirmModal(null);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getRoleBadge = (r: string) => {
    if (r === 'ADMIN') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          ADMIN
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
        {r}
      </span>
    );
  };

  const getStatusBadge = (user: AdminUserProfile) => {
    if (user.bannedAt) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
          Baneado
        </span>
      );
    }
    if (user.deletedAt) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Eliminado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        Activo
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-[#dec0b7] shadow-sm mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0b1c30] mb-3">
          <Filter size={16} className="text-[#9f3c16]" />
          <span>Filtros de Usuarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-xs font-medium text-[#565e74] mb-1">Buscar usuario</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ID, email, nickname o nombre..."
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="w-full text-xs bg-white border border-[#dec0b7] rounded-lg pl-7 pr-2.5 py-2 text-[#0b1c30] focus:ring-2 focus:ring-[#9f3c16]/20 focus:border-[#9f3c16]"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#565e74]" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-[#565e74] mb-1">Rol</label>
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
            <label className="block text-xs font-medium text-[#565e74] mb-1">Estado de Baneo</label>
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
            <label className="block text-xs font-medium text-[#565e74] mb-1">Estado de Cuenta</label>
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
      <div className="bg-white rounded-xl border border-[#dec0b7] shadow-sm">
        <div className="overflow-x-auto rounded-t-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#565e74] uppercase text-[11px] font-bold border-b border-[#dec0b7] tracking-wider">
              <tr>
                <th className="p-3.5">Usuario</th>
                <th className="p-3.5">Contacto</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Registro</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0b1c30]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#565e74]">
                    <div className="inline-block w-6 h-6 border-2 border-[#9f3c16] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando directorio de usuarios...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#565e74]">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-[#0b1c30]">No se encontraron usuarios</p>
                    <p className="text-xs text-[#565e74] mt-0.5">Prueba con otro término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isBanned = !!item.bannedAt;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedUserForDetail(item)}
                      className="hover:bg-[#f8f9ff] cursor-pointer transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {item.profilePicUrl ? (
                            <img
                              src={item.profilePicUrl}
                              alt={item.nickname}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#9f3c16] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {item.nickname?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#0b1c30] truncate">
                              {item.firstName} {item.lastName1 || ''}
                            </h4>
                            <p className="text-[11px] font-medium text-[#9f3c16] truncate">
                              @{item.nickname}
                            </p>
                            <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                              <CopyIdButton id={item.id} prefix="ID:" truncate maxTruncateWidth="max-w-[100px]" />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <div className="text-xs text-[#0b1c30] truncate max-w-[180px]">{item.email}</div>
                        {item.phone && <div className="text-[11px] text-[#565e74]">{item.phone}</div>}
                      </td>

                      {/* Role */}
                      <td className="p-3.5">{getRoleBadge(item.role)}</td>

                      {/* Status */}
                      <td className="p-3.5">{getStatusBadge(item)}</td>

                      {/* Registered Date */}
                      <td className="p-3.5 text-[#565e74]">
                        {new Date(item.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isBanned ? (
                            <button
                              onClick={() => handleOpenUnbanConfirm(item)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                              title="Desbanear usuario"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedUserForBan(item)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                              title="Banear usuario"
                            >
                              <Ban size={14} />
                            </button>
                          )}

                          {item.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleOpenPromoteConfirm(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                              title="Promover a Admin"
                            >
                              <ShieldCheck size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenHardDeleteConfirm(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 cursor-pointer"
                            title="Borrado físico"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            onClick={() => setSelectedUserForDetail(item)}
                            className="p-1.5 text-[#565e74] hover:text-[#9f3c16] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            title="Ver ficha completa"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageInfo && pageInfo.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#dec0b7] bg-[#FAF8F5] text-xs text-[#565e74] rounded-b-xl">
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
                Página <strong className="text-[#0b1c30]">{page + 1}</strong> de {pageInfo.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                  className="p-1.5 border border-[#dec0b7] rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pageInfo.totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                  className="p-1.5 border border-[#dec0b7] rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
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
