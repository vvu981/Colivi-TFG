import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ChoreResponseDto, ChoreTimeFilter } from '../types';
import {
  CheckCircle2,
  Zap,
  AlertTriangle,
  Trash2,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  ChoreFilterDropdown,
  type ChoreFilters,
  type ChoreStatusFilter,
} from './ChoreFilterDropdown';
import { calculateStatusCounts, filterChores } from '../utils/choreFilter';

interface ChoreListViewProps {
  chores: ChoreResponseDto[];
  timeFilter?: ChoreTimeFilter;
  onTimeFilterChange?: (filter: ChoreTimeFilter) => void;
  selectedUserId: string | null;
  onComplete: (chore: ChoreResponseDto) => void;
  onDelete: (chore: ChoreResponseDto) => void;
  currentUserId?: string;
  filters?: ChoreFilters;
  onFilterChange?: (filters: ChoreFilters) => void;
  showFilterDropdown?: boolean;
}

export const ChoreListView: React.FC<ChoreListViewProps> = ({
  chores,
  timeFilter,
  onTimeFilterChange,
  selectedUserId,
  onComplete,
  onDelete,
  currentUserId,
  filters: controlledFilters,
  onFilterChange: controlledOnFilterChange,
  showFilterDropdown = true,
}) => {
  // Estado local para filtros acumulables si no se pasa de forma controlada
  const [internalFilters, setInternalFilters] = useState<ChoreFilters>(() => {
    if (timeFilter === 'PENDING' || timeFilter === 'COMPLETED' || timeFilter === 'LATE') {
      return { status: timeFilter, date: 'ALL' };
    }
    if (timeFilter === 'TODAY' || timeFilter === 'WEEK' || timeFilter === 'MONTH') {
      return { status: 'ALL', date: timeFilter };
    }
    return { status: 'ALL', date: 'ALL' };
  });

  const filters = controlledFilters ?? internalFilters;

  // Sincronizar prop timeFilter si cambia externamente (ej. tests o control superior)
  useEffect(() => {
    if (!timeFilter) return;
    const targetStatus = (timeFilter === 'PENDING' || timeFilter === 'COMPLETED' || timeFilter === 'LATE') ? timeFilter : 'ALL';
    const targetDate = (timeFilter === 'TODAY' || timeFilter === 'WEEK' || timeFilter === 'MONTH') ? timeFilter : 'ALL';

    if (controlledOnFilterChange) {
      if (filters.status !== targetStatus || filters.date !== targetDate) {
        controlledOnFilterChange({ ...filters, status: targetStatus, date: targetDate });
      }
    } else {
      setInternalFilters((prev) => ({
        ...prev,
        status: targetStatus,
        date: targetDate,
      }));
    }
  }, [timeFilter]);

  const handleFilterChange = (newFilters: ChoreFilters) => {
    if (controlledOnFilterChange) {
      controlledOnFilterChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
    if (onTimeFilterChange) {
      if (newFilters.status !== 'ALL') {
        onTimeFilterChange(newFilters.status);
      } else if (newFilters.date === 'TODAY' || newFilters.date === 'WEEK' || newFilters.date === 'MONTH') {
        onTimeFilterChange(newFilters.date);
      } else {
        onTimeFilterChange('ALL');
      }
    }
  };

  // Conteo de elementos para las opciones de estado (respetando filtros temporales si están activos)
  const statusCounts = useMemo(() => {
    return calculateStatusCounts(chores, filters, selectedUserId);
  }, [chores, filters, selectedUserId]);

  // Aplicar filtros acumulables: Usuario + Estado + Fecha
  const filteredChores = useMemo(() => {
    return filterChores(chores, filters, selectedUserId);
  }, [chores, filters, selectedUserId]);

  const quickStatusTabs: { id: ChoreStatusFilter; label: string; isRescue?: boolean }[] = [
    { id: 'ALL', label: 'Todas' },
    { id: 'PENDING', label: 'No completadas' },
    { id: 'COMPLETED', label: 'Completadas' },
    { id: 'LATE', label: 'Para rescatar', isRescue: true },
  ];

  const formatDueDate = (dueDateStr: string, isLate: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDateStr === todayStr) {
      return <span className="text-primary font-bold">Hoy</span>;
    }
    if (isLate) {
      return <span className="text-error font-bold">¡Vencida ({dueDateStr})!</span>;
    }
    return <span>{dueDateStr}</span>;
  };

  const hasActiveFilters = filters.status !== 'ALL' || filters.date !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Barra de Filtros: Filtros Acumulables (visible solo en modo standalone con dropdown propio) */}
      {showFilterDropdown && (
        <div className="flex items-center gap-2 flex-wrap border-b border-outline-variant/40 pb-3">
          <ChoreFilterDropdown
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={() => handleFilterChange({ status: 'ALL', date: 'ALL', customStartDate: '', customEndDate: '' })}
            statusCounts={statusCounts}
          />
        </div>
      )}

      {/* Chips de Filtros Activos Acumulados (solo en modo standalone con dropdown propio) */}
      {showFilterDropdown && hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
          <span className="text-[11px] font-semibold text-secondary">Filtros acumulados:</span>

          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-medium text-[11px]">
              <span>Estado: {quickStatusTabs.find((t) => t.id === filters.status)?.label}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, status: 'ALL' })}
                className="hover:text-primary-container cursor-pointer p-0.5"
                title="Quitar filtro de estado"
                aria-label="Quitar filtro de estado"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.date !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-medium text-[11px]">
              <span>
                {filters.date === 'TODAY'
                  ? 'Fecha: Hoy'
                  : filters.date === 'WEEK'
                    ? 'Fecha: Esta semana'
                    : filters.date === 'MONTH'
                      ? 'Fecha: Este mes'
                      : `Fechas: ${filters.customStartDate || '...'} a ${filters.customEndDate || '...'}`}
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, date: 'ALL', customStartDate: '', customEndDate: '' })}
                className="hover:text-primary-container cursor-pointer p-0.5"
                title="Quitar filtro de fecha"
                aria-label="Quitar filtro de fecha"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => handleFilterChange({ status: 'ALL', date: 'ALL', customStartDate: '', customEndDate: '' })}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-error hover:underline cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer todo</span>
          </button>
        </div>
      )}

      {/* Listado de Tareas */}
      {filteredChores.length === 0 ? (
        <div className="py-12 text-center text-xs text-secondary space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-secondary/50" />
          <p className="font-semibold text-on-surface">No hay tareas en este filtro</p>
          <p className="text-[11px]">
            {timeFilter === 'LATE'
              ? '¡Excelente! No hay ninguna tarea doméstica atrasada pendiente de rescate.'
              : timeFilter === 'COMPLETED'
                ? 'Aún no hay tareas completadas en este filtro.'
                : timeFilter === 'PENDING'
                  ? '¡Genial! No hay tareas pendientes en este filtro.'
                  : 'Prueba cambiando los filtros de tiempo o el miembro seleccionado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChores.map((chore) => {
            const isAssignee = currentUserId === chore.assigneeId;
            const canRescue = chore.canRescue;
            const canComplete = chore.canComplete;
            const isLate = chore.isLate && chore.status === 'PENDING';

            const choreColor = chore.assigneeColor || '#4F46E5';

            return (
              <div
                key={chore.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLate
                    ? 'bg-error-container/20 border-error/40'
                    : chore.status === 'COMPLETED'
                      ? 'bg-surface-container-low/40 border-outline-variant/30 opacity-75'
                      : chore.status === 'LATE_COMPLETED'
                        ? 'bg-tertiary-container/20 border-tertiary/30'
                        : 'bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container-low/30'
                }`}
                style={{ borderLeftWidth: '4px', borderLeftColor: choreColor }}
              >
                {/* Información de la Tarea */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm font-bold text-on-surface truncate ${
                        chore.status === 'COMPLETED' ? 'line-through text-secondary' : ''
                      }`}
                    >
                      {chore.title}
                    </h4>

                    {/* Badge de Puntos */}
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      +{chore.basePoints} pts
                    </span>

                    {/* Estado contextual */}
                    {isLate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px] animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        ¡Atrasada - Rescatable!
                      </span>
                    )}

                    {chore.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Completada a tiempo
                      </span>
                    )}

                    {chore.status === 'LATE_COMPLETED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">
                        <Zap className="w-3 h-3" />
                        Rescatada
                      </span>
                    )}
                  </div>

                  {chore.description && (
                    <p className="text-xs text-secondary line-clamp-2">
                      {chore.description}
                    </p>
                  )}

                  {/* Metadatos: Asignado y Vencimiento */}
                  <div className="flex items-center gap-4 text-xs text-secondary flex-wrap pt-1">
                    <Link
                      to={`/users/${chore.assigneeId}`}
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
                      title={`Ver perfil de ${chore.assigneeName}`}
                    >
                      {chore.assigneeAvatar ? (
                        <img
                          src={chore.assigneeAvatar}
                          alt={chore.assigneeName}
                          className="w-4 h-4 rounded-full object-cover group-hover:ring-1 group-hover:ring-primary"
                        />
                      ) : (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:ring-1 group-hover:ring-primary"
                          style={{ backgroundColor: choreColor }}
                        />
                      )}
                      <span>
                        Asignada a: <strong className="text-on-surface group-hover:text-primary group-hover:underline">{chore.assigneeName}</strong>
                      </span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Vencimiento: {formatDueDate(chore.dueDate, isLate)}</span>
                    </div>

                    {chore.completedByName && (
                      <span className="text-[11px] font-semibold text-secondary">
                        Realizada por:{' '}
                        {chore.completedById ? (
                          <Link
                            to={`/users/${chore.completedById}`}
                            className="text-on-surface hover:text-primary hover:underline transition-colors font-bold"
                            title={`Ver perfil de ${chore.completedByName}`}
                          >
                            {chore.completedByName}
                          </Link>
                        ) : (
                          <strong className="text-on-surface">{chore.completedByName}</strong>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {canRescue && (
                    <button
                      type="button"
                      onClick={() => onComplete(chore)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-tertiary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-tertiary-container transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>¡Rescatar! (+{chore.basePoints} pts)</span>
                    </button>
                  )}

                  {canComplete && !canRescue && (
                    <button
                      type="button"
                      onClick={() => onComplete(chore)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-container transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completar</span>
                    </button>
                  )}

                  {chore.status === 'PENDING' && (isAssignee || currentUserId) && (
                    <button
                      type="button"
                      onClick={() => onDelete(chore)}
                      className="p-1.5 text-secondary hover:text-error rounded-lg hover:bg-error/10 transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
