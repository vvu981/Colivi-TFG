import React, { useState } from 'react';
import type { ReportItem, ReportStatus, PageResponse } from '../../types/admin.types';
import { AdminBulkActionModal } from './AdminBulkActionModal';
import { CopyIdButton } from '../common/CopyIdButton';
import { Select } from '../../../../components/ui/Select';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  User,
  Layers,
} from 'lucide-react';

const pageSizeOptions = [
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
  { value: '50', label: '50 por página' },
];

interface AdminReportsTableProps {
  reports: ReportItem[];
  pageInfo: PageResponse<ReportItem> | null;
  page: number;
  size: number;
  isLoading: boolean;
  selectedIds: string[];
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectReport: (report: ReportItem) => void;
  onBulkUpdate: (status: ReportStatus, adminNotes: string) => Promise<void>;
}

export const AdminReportsTable: React.FC<AdminReportsTableProps> = ({
  reports,
  pageInfo,
  page,
  size,
  isLoading,
  selectedIds,
  onPageChange,
  onSizeChange,
  onToggleSelect,
  onToggleSelectAll,
  onSelectReport,
  onBulkUpdate,
}) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            Desestimada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700">
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

  const allSelected = reports.length > 0 && selectedIds.length === reports.length;

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white rounded-xl border border-[#dec0b7] shadow-sm">
        <div className="overflow-x-auto rounded-t-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#565e74] uppercase text-[11px] font-bold border-b border-[#dec0b7] tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-[#dec0b7] text-[#9f3c16] focus:ring-[#9f3c16] h-4 w-4"
                  />
                </th>
                <th className="p-3.5">ID / Fecha</th>
                <th className="p-3.5">Objetivo</th>
                <th className="p-3.5">Motivo</th>
                <th className="p-3.5 max-w-[200px]">Descripción</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0b1c30]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#565e74]">
                    <div className="inline-block w-6 h-6 border-2 border-[#9f3c16] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando cola de moderación...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#565e74]">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-[#0b1c30]">No se encontraron denuncias</p>
                    <p className="text-xs text-[#565e74] mt-0.5">Ajusta los filtros o limpia la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                reports.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectReport(item)}
                      className={`hover:bg-[#f8f9ff] cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(item.id)}
                          className="rounded border-[#dec0b7] text-[#9f3c16] focus:ring-[#9f3c16] h-4 w-4"
                        />
                      </td>

                      {/* ID & Date */}
                      <td className="p-3.5">
                        <CopyIdButton id={item.id} truncate maxTruncateWidth="max-w-[80px]" />
                        <div className="text-[11px] text-[#565e74] mt-0.5">
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
                        <span className="font-semibold text-xs text-[#0b1c30]">
                          {getReasonLabel(item.reason)}
                        </span>
                      </td>

                      {/* Description snippet */}
                      <td className="p-3.5 max-w-[220px]">
                        <p className="text-xs text-[#565e74] line-clamp-2" title={item.description}>
                          {item.description || <span className="italic text-slate-400">Sin descripción</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">{getStatusBadge(item.status)}</td>

                      {/* Action */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectReport(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#9f3c16] hover:bg-[#9f3c16]/10 rounded-lg transition-colors border border-[#dec0b7]"
                        >
                          <Eye size={13} />
                          <span>Expediente</span>
                        </button>
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
              <span>• Total: {pageInfo.totalElements} denuncias</span>
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

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0b1c30] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#9f3c16] text-white text-xs font-bold rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium">denuncias seleccionadas</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9f3c16] hover:bg-[#bf542c] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Layers size={14} />
            <span>Aplicar Acción Masiva</span>
          </button>
        </div>
      )}

      {/* Bulk Action Modal */}
      <AdminBulkActionModal
        isOpen={isBulkModalOpen}
        selectedCount={selectedIds.length}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={onBulkUpdate}
      />
    </div>
  );
};
