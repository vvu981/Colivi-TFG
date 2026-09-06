import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, X, LifeBuoy, RotateCcw, Check } from 'lucide-react';
import { DatePicker } from '../../../components/ui/DatePicker';

export type ChoreStatusFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'LATE';
export type ChoreDateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export interface ChoreFilters {
  status: ChoreStatusFilter;
  date: ChoreDateFilter;
  customStartDate?: string;
  customEndDate?: string;
}

export interface ChoreFilterDropdownProps {
  filters: ChoreFilters;
  onFilterChange: (filters: ChoreFilters) => void;
  onReset: () => void;
  statusCounts?: {
    ALL: number;
    PENDING: number;
    COMPLETED: number;
    LATE: number;
  };
}

export const ChoreFilterDropdown: React.FC<ChoreFilterDropdownProps> = ({
  filters,
  onFilterChange,
  onReset,
  statusCounts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular número de dimensiones de filtro activas
  let activeCount = 0;
  if (filters.status !== 'ALL') activeCount++;
  if (filters.date !== 'ALL') activeCount++;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // Prevenir cierre si se interactúa con el portal del DatePicker
      if (target.closest?.('[data-datepicker-portal]')) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const statusOptions: { id: ChoreStatusFilter; label: string; isRescue?: boolean }[] = [
    { id: 'ALL', label: 'Todas' },
    { id: 'PENDING', label: 'No completadas' },
    { id: 'COMPLETED', label: 'Completadas' },
    { id: 'LATE', label: 'Para rescatar', isRescue: true },
  ];

  const dateOptions: { id: ChoreDateFilter; label: string }[] = [
    { id: 'ALL', label: 'Cualquier fecha' },
    { id: 'TODAY', label: 'Hoy' },
    { id: 'WEEK', label: 'Esta semana' },
    { id: 'MONTH', label: 'Este mes' },
    { id: 'CUSTOM', label: 'Entre fechas (X y Z)' },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Botón Disparador del Desplegable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
          activeCount > 0
            ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs'
            : 'bg-surface-container border-outline-variant/60 text-secondary hover:text-on-surface hover:bg-surface-container-high'
        }`}
        aria-expanded={isOpen}
        aria-label="Abrir filtros acumulables"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Panel Desplegable de Filtros Acumulables */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xl p-5 z-40 space-y-4 animate-in fade-in zoom-in-95">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div>
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Filtros Acumulables</span>
              </h4>
              <p className="text-[11px] text-secondary">
                Combina estado y fechas para afinar el listado
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sección 1: Estado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block">
              Estado de la tarea
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((opt) => {
                const isSelected = filters.status === opt.id;
                const count = statusCounts ? statusCounts[opt.id] : undefined;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, status: opt.id })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/40 text-secondary hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {opt.isRescue && (
                        <LifeBuoy
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-white' : 'text-primary'
                          }`}
                        />
                      )}
                      <span>{opt.label}</span>
                    </span>
                    {count !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-container-high text-secondary'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección 2: Período de Tiempo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block">
              Fecha de vencimiento
            </label>
            <div className="flex flex-wrap gap-1.5">
              {dateOptions.map((opt) => {
                const isSelected = filters.date === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, date: opt.id })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/40 text-secondary hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección 3: Selector de Rango Personalizado (Entre X y Z) */}
          {filters.date === 'CUSTOM' && (
            <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-2.5 animate-in fade-in">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span>Rango entre fechas (X y Z)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="filter-start-date" className="text-[11px] font-bold text-secondary block">
                    Desde (Fecha X)
                  </label>
                  <DatePicker
                    id="filter-start-date"
                    value={filters.customStartDate || ''}
                    onChange={(val) => onFilterChange({ ...filters, customStartDate: val })}
                    max={filters.customEndDate}
                    placeholder="Fecha inicio"
                    className="!py-1.5 !text-xs !bg-surface-container-lowest"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="filter-end-date" className="text-[11px] font-bold text-secondary block">
                    Hasta (Fecha Z)
                  </label>
                  <DatePicker
                    id="filter-end-date"
                    value={filters.customEndDate || ''}
                    onChange={(val) => onFilterChange({ ...filters, customEndDate: val })}
                    min={filters.customStartDate}
                    placeholder="Fecha fin"
                    className="!py-1.5 !text-xs !bg-surface-container-lowest"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pie del Desplegable */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-error hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            ) : (
              <span className="text-[11px] text-secondary">Sin filtros adicionales</span>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
