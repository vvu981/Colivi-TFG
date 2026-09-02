import React from 'react';
import type { AdminListingFilters } from '../../types/admin.types';
import { Select, type SelectOption } from '../../../../components/ui/Select';
import { Filter, RotateCcw, Search, Building } from 'lucide-react';

interface AdminListingFiltersProps {
  filters: AdminListingFilters;
  onFilterChange: (key: keyof AdminListingFilters, value: any) => void;
  onReset: () => void;
}

const statusOptions: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'UNAVAILABLE', label: 'No disponible' },
  { value: 'BANNED', label: 'Baneado' },
];

const rentalTypeOptions: SelectOption[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ROOM', label: 'Habitación' },
  { value: 'ENTIRE_PLACE', label: 'Piso Completo' },
];

export const AdminListingFiltersComponent: React.FC<AdminListingFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <Filter size={16} className="text-primary" />
          <span>Filtros de Anuncios</span>
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
        {/* Título o ID */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">ID o Título</label>
          <div className="relative">
            <input
              type="text"
              placeholder="ID o título..."
              value={filters.title || ''}
              onChange={(e) => onFilterChange('title', e.target.value)}
              className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-secondary" />
          </div>
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Ciudad</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Madrid, Barcelona..."
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value)}
              className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Building size={13} className="absolute left-2.5 top-2.5 text-secondary" />
          </div>
        </div>

        {/* Estado (Select reutilizable) */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Estado</label>
          <Select
            value={filters.status || ''}
            onChange={(val) => onFilterChange('status', val)}
            options={statusOptions}
            className="text-xs py-1.5"
          />
        </div>

        {/* Tipo de Alquiler (Select reutilizable) */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Tipo de Alquiler</label>
          <Select
            value={filters.rentalType || ''}
            onChange={(val) => onFilterChange('rentalType', val)}
            options={rentalTypeOptions}
            className="text-xs py-1.5"
          />
        </div>

        {/* Precio Mínimo */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Precio Mín (€)</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl px-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Precio Máximo */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Precio Máx (€)</label>
          <input
            type="number"
            placeholder="3000"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl px-2.5 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};
