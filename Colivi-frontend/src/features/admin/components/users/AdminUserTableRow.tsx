import React from 'react';
import type { AdminUserProfile } from '../../types/admin.types';
import { CopyIdButton } from '../common/CopyIdButton';
import {
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

interface AdminUserTableRowProps {
  item: AdminUserProfile;
  onSelectUserForDetail: (user: AdminUserProfile) => void;
  onSelectUserForBan: (user: AdminUserProfile) => void;
  onOpenUnbanConfirm: (user: AdminUserProfile) => void;
  onOpenPromoteConfirm: (user: AdminUserProfile) => void;
  onOpenHardDeleteConfirm: (user: AdminUserProfile) => void;
}

const getRoleBadge = (r: string) => {
  if (r === 'ADMIN') {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-error-container text-error border border-error/20">
        ADMIN
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-secondary">
      {r}
    </span>
  );
};

const getStatusBadge = (user: AdminUserProfile) => {
  if (user.bannedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error border border-error/20">
        Baneado
      </span>
    );
  }
  if (user.deletedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary border border-outline-variant/60">
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

export const AdminUserTableRow: React.FC<AdminUserTableRowProps> = React.memo(
  ({
    item,
    onSelectUserForDetail,
    onSelectUserForBan,
    onOpenUnbanConfirm,
    onOpenPromoteConfirm,
    onOpenHardDeleteConfirm,
  }) => {
    const isBanned = !!item.bannedAt;

    return (
      <tr
        onClick={() => onSelectUserForDetail(item)}
        className="hover:bg-surface-container-low cursor-pointer transition-colors"
      >
        {/* Avatar & Name */}
        <td className="p-3.5">
          <div className="flex items-center gap-3">
            {item.profilePicUrl ? (
              <img
                src={item.profilePicUrl}
                alt={item.nickname}
                className="w-10 h-10 rounded-full object-cover border border-outline-variant/60 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                {item.nickname?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-on-surface truncate">
                {item.firstName} {item.lastName1 || ''}
              </h4>
              <p className="text-[11px] font-medium text-primary truncate">
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
          <div className="text-xs text-on-surface truncate max-w-[180px]">{item.email}</div>
          {item.phone && <div className="text-[11px] text-secondary">{item.phone}</div>}
        </td>

        {/* Role */}
        <td className="p-3.5">{getRoleBadge(item.role)}</td>

        {/* Status */}
        <td className="p-3.5">{getStatusBadge(item)}</td>

        {/* Registered Date */}
        <td className="p-3.5 text-secondary">
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
                type="button"
                onClick={() => onOpenUnbanConfirm(item)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                title="Desbanear usuario"
              >
                <CheckCircle2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectUserForBan(item)}
                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                title="Banear usuario"
              >
                <Ban size={14} />
              </button>
            )}

            {item.role !== 'ADMIN' && (
              <button
                type="button"
                onClick={() => onOpenPromoteConfirm(item)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                title="Promover a Admin"
              >
                <ShieldCheck size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenHardDeleteConfirm(item)}
              className="p-1.5 text-error hover:bg-error-container/40 rounded-lg transition-colors border border-error/20 cursor-pointer"
              title="Borrado físico"
            >
              <Trash2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => onSelectUserForDetail(item)}
              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors border border-outline-variant cursor-pointer"
              title="Ver ficha completa"
            >
              <Eye size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }
);
