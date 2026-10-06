import React, { useState } from 'react';
import type { ReportItem, ReportStatus, PageResponse } from '../../types/admin.types';
import { AdminBulkActionModal } from './AdminBulkActionModal';
import { AdminReportTableRow } from './AdminReportTableRow';
import { Select } from '../../../../components/ui/Select';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
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

  const allSelected = reports.length > 0 && selectedIds.length === reports.length;

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-secondary uppercase text-[11px] font-bold border-b border-outline-variant tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
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
            <tbody className="divide-y divide-outline-variant/30 text-on-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs">Cargando cola de moderación...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-secondary">
                    <FileText size={32} className="mx-auto text-secondary/40 mb-2" />
                    <p className="text-sm font-semibold text-on-surface">No se encontraron denuncias</p>
                    <p className="text-xs text-secondary mt-0.5">Ajusta los filtros o limpia la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                reports.map((item) => (
                  <AdminReportTableRow
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onToggleSelect={onToggleSelect}
                    onSelectReport={onSelectReport}
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
              <span>• Total: {pageInfo.totalElements} denuncias</span>
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

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-on-surface text-surface-container-lowest px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary text-on-primary text-xs font-bold rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium">denuncias seleccionadas</span>
          </div>

          <div className="h-4 w-px bg-outline-variant/40" />

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
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
