import React from 'react';
import type { ReportItem, ReportStatus } from '../../types/admin.types';
import { CopyIdButton } from '../common/CopyIdButton';
import { Eye, Home, User } from 'lucide-react';

interface AdminReportTableRowProps {
  item: ReportItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onSelectReport: (report: ReportItem) => void;
}

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Pendiente
        </span>
      );
    case 'INVESTIGATING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          Investigando
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Resuelta
        </span>
      );
    case 'DISMISSED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-secondary border border-outline-variant/60">
          Desestimada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface text-secondary">
          {status}
        </span>
      );
  }
};

const getReasonLabel = (reason: string) => {
  switch (reason) {
    case 'FRAUD':
      return 'Fraude / Falso';
    case 'SPAM':
      return 'Spam';
    case 'HARASSMENT':
      return 'Acoso / Hostilidad';
    case 'INAPPROPRIATE_CONTENT':
      return 'Inapropiado';
    case 'OTHER':
      return 'Otro';
    default:
      return reason;
  }
};

export const AdminReportTableRow: React.FC<AdminReportTableRowProps> = React.memo(
  ({ item, isSelected, onToggleSelect, onSelectReport }) => {
    return (
      <tr
        onClick={() => onSelectReport(item)}
        className={`hover:bg-surface-container-low cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/5' : ''
        }`}
      >
        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
        </td>

        {/* ID & Date */}
        <td className="p-3.5">
          <CopyIdButton id={item.id} truncate maxTruncateWidth="max-w-[80px]" />
          <div className="text-[11px] text-secondary mt-0.5">
            {new Date(item.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </td>

        {/* Target */}
        <td className="p-3.5">
          <div className="flex items-center gap-1.5 font-medium">
            {item.targetType === 'LISTING' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                <Home size={11} />
                Anuncio
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
                <User size={11} />
                Usuario
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <CopyIdButton id={item.targetId} truncate maxTruncateWidth="max-w-[90px]" />
          </div>
        </td>

        {/* Reason */}
        <td className="p-3.5">
          <span className="font-semibold text-xs text-on-surface">
            {getReasonLabel(item.reason)}
          </span>
        </td>

        {/* Description snippet */}
        <td className="p-3.5 max-w-[220px]">
          <p className="text-xs text-secondary line-clamp-2" title={item.description}>
            {item.description || <span className="italic text-secondary/60">Sin descripción</span>}
          </p>
        </td>

        {/* Status */}
        <td className="p-3.5">{getStatusBadge(item.status)}</td>

        {/* Action */}
        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSelectReport(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-outline-variant cursor-pointer"
          >
            <Eye size={13} />
            <span>Expediente</span>
          </button>
        </td>
      </tr>
    );
  }
);
