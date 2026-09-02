import React from 'react';
import type { ReportFilterCriteria, ReportReason, ReportStatus, ReportTargetType } from '../../types/admin.types';
import { Select, type SelectOption } from '../../../../components/ui/Select';
import { Filter, RotateCcw, Search } from 'lucide-react';

interface AdminReportFiltersProps {
  filters: ReportFilterCriteria;
  onFilterChange: (key: keyof ReportFilterCriteria, value: any) => void;
  onReset: () => void;
}

const statusOptions: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'INVESTIGATING', label: 'En Investigación' },
  { value: 'RESOLVED', label: 'Resuelta' },
  { value: 'DISMISSED', label: 'Desestimada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const targetTypeOptions: SelectOption[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'LISTING', label: 'Anuncio (Listing)' },
  { value: 'USER', label: 'Usuario (User)' },
];

const reasonOptions: SelectOption[] = [
  { value: '', label: 'Todos los motivos' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FRAUD', label: 'Fraude' },
  { value: 'HARASSMENT', label: 'Acoso' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenido Inapropiado' },
  { value: 'OTHER', label: 'Otro' },
];

export const AdminReportFilters: React.FC<AdminReportFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <Filter size={16} className="text-primary" />
          <span>Filtros de Búsqueda</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary font-medium transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Limpiar filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Buscar por ID Denuncia / Texto */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">ID Denuncia / Texto</label>
          <div className="relative">
            <input
              type="text"
              placeholder="ID denuncia, texto..."
              value={filters.query || ''}
              onChange={(e) => onFilterChange('query', e.target.value)}
              className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-secondary" />
          </div>
        </div>

        {/* Estado (Select reutilizable) */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Estado</label>
          <Select
            value={filters.status || ''}
            onChange={(val) => onFilterChange('status', (val as ReportStatus) || '')}
            options={statusOptions}
            className="text-xs py-1.5"
          />
        </div>

        {/* Tipo de Objetivo (Select reutilizable) */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Tipo de Objetivo</label>
          <Select
            value={filters.targetType || ''}
            onChange={(val) => onFilterChange('targetType', (val as ReportTargetType) || '')}
            options={targetTypeOptions}
            className="text-xs py-1.5"
          />
        </div>

        {/* Motivo (Select reutilizable) */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Motivo</label>
          <Select
            value={filters.reason || ''}
            onChange={(val) => onFilterChange('reason', (val as ReportReason) || '')}
            options={reasonOptions}
            className="text-xs py-1.5"
          />
        </div>

        {/* ID Objetivo */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">ID de Objetivo</label>
          <div className="relative">
            <input
              type="text"
              placeholder="UUID de objetivo..."
              value={filters.targetId || ''}
              onChange={(e) => onFilterChange('targetId', e.target.value)}
              className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-secondary" />
          </div>
        </div>

        {/* Rango de Fechas */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Fecha Desde</label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => onFilterChange('from', e.target.value)}
            className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl px-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};
