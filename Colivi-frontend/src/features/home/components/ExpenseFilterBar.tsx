import React, { useMemo } from 'react';
import { Search, X, Receipt, ArrowRightLeft, Layers, Users } from 'lucide-react';
import { Select, type SelectOption } from '../../../components/ui/Select';
import type { HomeMemberResponseDto } from '../types';
import { getUserInitial } from '../utils/userDisplay';

interface ExpenseFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  payerFilter: string;
  onPayerChange: (payerId: string) => void;
  typeFilter: 'ALL' | 'EXPENSES' | 'PAYMENTS';
  onTypeChange: (type: 'ALL' | 'EXPENSES' | 'PAYMENTS') => void;
  activeMembers: HomeMemberResponseDto[];
  totalResults?: number;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  payerFilter,
  onPayerChange,
  typeFilter,
  onTypeChange,
  activeMembers,
  totalResults,
}) => {
  const hasActiveFilters = searchQuery !== '' || payerFilter !== '' || typeFilter !== 'ALL';

  const clearFilters = () => {
    onSearchChange?.('');
    onPayerChange?.('');
    onTypeChange?.('ALL');
  };

  const payerOptions: SelectOption[] = useMemo(() => {
    const allOption: SelectOption = {
      value: '',
      label: 'Todos los pagadores',
      icon: (
        <span className="w-5 h-5 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0">
          <Users className="w-3 h-3" />
        </span>
      ),
    };

    const memberOptions: SelectOption[] = activeMembers.map((m) => {
      const initial = getUserInitial(m.fullName);
      return {
        value: m.userId,
        label: m.fullName,
        icon: m.profilePicUrl ? (
          <img
            src={m.profilePicUrl}
            alt={m.fullName}
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            {initial}
          </span>
        ),
      };
    });

    return [allOption, ...memberOptions];
  }, [activeMembers]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-3.5 space-y-3 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Buscador de concepto */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por concepto o notas..."
            className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant/60 rounded-xl text-xs text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por pagador con componente Select de la aplicación */}
        <div className="sm:w-52 shrink-0">
          <Select
            value={payerFilter}
            onChange={onPayerChange}
            options={payerOptions}
            placeholder="Todos los pagadores"
            aria-label="Filtrar por pagador"
            className="!py-1.5 !text-xs !bg-surface !border-outline-variant/60"
          />
        </div>
      </div>

      {/* Selector de Tipo (Todos / Gastos / Pagos) y Contador */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 p-0.5 bg-surface-container rounded-xl">
          <button
            type="button"
            onClick={() => onTypeChange('ALL')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-surface text-on-surface shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Todos</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('EXPENSES')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              typeFilter === 'EXPENSES'
                ? 'bg-surface text-primary shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Receipt className="w-3 h-3" />
            <span>Solo Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('PAYMENTS')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              typeFilter === 'PAYMENTS'
                ? 'bg-surface text-teal-700 shadow-xs font-bold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Solo Pagos</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-medium text-error hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
          {totalResults !== undefined && (
            <span className="text-[11px] text-secondary">
              {totalResults} resultado{totalResults === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
