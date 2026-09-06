import React, { useState, useMemo } from 'react';
import type { HomeDetailResponseDto } from '../../home/types';
import type { ChoreResponseDto, ChoreTimeFilter, DeleteMode } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { useChores } from '../hooks/useChores';
import { ChoreUserFilter } from './ChoreUserFilter';
import { ChoreLeaderboard } from './ChoreLeaderboard';
import { ChoreCalendarView } from './ChoreCalendarView';
import { ChoreListView } from './ChoreListView';
import { CreateChoreModal } from './CreateChoreModal';
import { ConfirmDeleteChoreModal } from './ConfirmDeleteChoreModal';
import { PersonalColorModal } from './PersonalColorModal';
import {
  ChoreFilterDropdown,
  type ChoreFilters,
} from './ChoreFilterDropdown';
import { calculateStatusCounts, filterChores } from '../utils/choreFilter';
import { Calendar, List, Plus, Sparkles, X, RotateCcw } from 'lucide-react';
import { Spinner } from '../../../components/feedback/Spinner';

interface HomeChoresTabProps {
  home: HomeDetailResponseDto;
  currentUserId?: string;
  onHomeUpdate?: () => Promise<void> | void;
}

export const HomeChoresTab: React.FC<HomeChoresTabProps> = ({
  home,
  currentUserId,
  onHomeUpdate,
}) => {
  // Overrides locales de color por usuario para actualización instantánea
  const [memberColorOverrides, setMemberColorOverrides] = useState<Record<string, string>>({});

  // Miembros efectivos con colores actualizados
  const effectiveMembers = useMemo(() => {
    return home.members.map((m) => {
      const override = memberColorOverrides[m.userId];
      return override ? { ...m, color: override } : m;
    });
  }, [home.members, memberColorOverrides]);

  const currentMember = useMemo(() => {
    return effectiveMembers.find((m) => m.userId === currentUserId);
  }, [effectiveMembers, currentUserId]);

  const currentMemberColor = currentMember?.color || '#4F46E5';

  // Filtro global de usuario
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Switch de vista: Calendario vs Lista
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filtros acumulables (Estado y Fechas) aplicables a Calendario y Lista
  const [filters, setFilters] = useState<ChoreFilters>({
    status: 'ALL',
    date: 'ALL',
  });

  // Filtro temporal legado para compatibilidad
  const [timeFilter, setTimeFilter] = useState<ChoreTimeFilter>('ALL');

  // Período para el leaderboard
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [choreToDelete, setChoreToDelete] = useState<ChoreResponseDto | null>(null);

  const queryClient = useQueryClient();

  // Hook de tareas y gamificación
  const {
    chores,
    isLoadingChores,
    leaderboard,
    isLoadingLeaderboard,
    createChore,
    isCreatingChore,
    completeChore,
    deleteChore,
    isDeletingChore,
  } = useChores(home.id, undefined, leaderboardPeriod);

  // Conteo de tareas pendientes por usuario para el filtro global
  const pendingCountsByUserId: Record<string, number> = {};
  for (const chore of chores) {
    if (chore.status === 'PENDING') {
      pendingCountsByUserId[chore.assigneeId] =
        (pendingCountsByUserId[chore.assigneeId] || 0) + 1;
    }
  }

  // Conteo de tareas por estado para el dropdown de filtros según los filtros activos
  const statusCounts = useMemo(() => {
    return calculateStatusCounts(chores, filters, selectedUserId);
  }, [chores, filters, selectedUserId]);

  // Tareas filtradas acumulativamente (Usuario + Estado + Fechas) aplicadas a ambas vistas
  const filteredChores = useMemo(() => {
    return filterChores(chores, filters, selectedUserId);
  }, [chores, filters, selectedUserId]);

  const hasActiveFilters = filters.status !== 'ALL' || filters.date !== 'ALL';

  const handleCompleteChore = async (chore: ChoreResponseDto) => {
    try {
      await completeChore(chore.id);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error al completar la tarea');
    }
  };

  const handleDeleteConfirm = async (choreId: string, mode: DeleteMode) => {
    try {
      await deleteChore({ choreId, mode });
      setChoreToDelete(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error al eliminar la tarea');
    }
  };

  return (
    <div className="space-y-6">
      {/* Leaderboard / Panel de Rendimiento y Puntos Esperados */}
      <ChoreLeaderboard
        leaderboard={leaderboard}
        period={leaderboardPeriod}
        onPeriodChange={setLeaderboardPeriod}
        isLoading={isLoadingLeaderboard}
      />

      {/* Card Unificada: Cabecera de Tareas Domésticas, Filtros y Vista de Calendario / Lista */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Barra Superior de Control de Tareas: Header, Desplegable Miembro, Filtros Acumulables, Switch Vistas, Mi color y Botón Nueva Tarea */}
        <div className="space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-on-surface truncate">
                  Tareas Domésticas Gamificadas
                </h2>
              </div>
              <p className="text-xs text-secondary">
                Gana puntos completando a tiempo o rescata tareas atrasadas de tus compañeros
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro desplegable por miembro con avatar */}
              <ChoreUserFilter
                members={effectiveMembers}
                selectedUserId={selectedUserId}
                onSelectUser={setSelectedUserId}
                pendingCountsByUserId={pendingCountsByUserId}
              />

              {/* Botón de Filtros Acumulables para ambas vistas (Calendario y Lista) */}
              <ChoreFilterDropdown
                filters={filters}
                onFilterChange={setFilters}
                onReset={() => setFilters({ status: 'ALL', date: 'ALL', customStartDate: '', customEndDate: '' })}
                statusCounts={statusCounts}
              />

              {/* Switch de Vistas (Calendario / Lista) */}
              <div className="flex bg-surface-container rounded-2xl p-1 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendario</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
              </div>

              {/* Botón Mi Color */}
              <button
                type="button"
                onClick={() => setIsColorModalOpen(true)}
                title="Personalizar mi color en este hogar"
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold rounded-2xl border border-outline-variant/60 transition-all shrink-0 cursor-pointer"
              >
                <span
                  data-testid="my-color-dot"
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs shrink-0"
                  style={{ backgroundColor: currentMemberColor }}
                />
                <span className="hidden sm:inline">Mi color</span>
              </button>

              {/* Botón Nueva Tarea */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-primary-container transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          </div>

          {/* Chips de Filtros Activos y Contador */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-secondary">Filtros acumulados:</span>

                {filters.status !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-medium text-[11px]">
                    <span>
                      Estado:{' '}
                      {filters.status === 'PENDING'
                        ? 'No completadas'
                        : filters.status === 'COMPLETED'
                          ? 'Completadas'
                          : 'Para rescatar'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, status: 'ALL' }))}
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
                      onClick={() => setFilters((prev) => ({ ...prev, date: 'ALL', customStartDate: '', customEndDate: '' }))}
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
                  onClick={() => setFilters({ status: 'ALL', date: 'ALL', customStartDate: '', customEndDate: '' })}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-error hover:underline cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer todo</span>
                </button>
              </div>

              <span className="text-xs font-medium text-secondary">
                {filteredChores.length} tarea{filteredChores.length === 1 ? '' : 's'} encontrada{filteredChores.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>

        {/* Línea separatoria sutil entre controles y vista */}
        <div className="border-t border-outline-variant/40" />

        {/* Contenido Principal según el modo de vista (Calendario o Lista) */}
        {isLoadingChores ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Spinner />
          </div>
        ) : viewMode === 'calendar' ? (
          <ChoreCalendarView
            chores={filteredChores}
            selectedUserId={selectedUserId}
            onComplete={handleCompleteChore}
            onDelete={setChoreToDelete}
            currentUserId={currentUserId}
          />
        ) : (
          <ChoreListView
            chores={filteredChores}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            selectedUserId={selectedUserId}
            onComplete={handleCompleteChore}
            onDelete={setChoreToDelete}
            currentUserId={currentUserId}
            filters={filters}
            onFilterChange={setFilters}
            showFilterDropdown={false}
          />
        )}
      </div>

      {/* Modal: Crear Tarea */}
      <CreateChoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={effectiveMembers}
        onSubmit={async (data) => {
          await createChore(data);
        }}
        isSubmitting={isCreatingChore}
      />

      {/* Modal: Confirmar Borrado */}
      <ConfirmDeleteChoreModal
        chore={choreToDelete}
        isOpen={Boolean(choreToDelete)}
        onClose={() => setChoreToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeletingChore}
      />

      {/* Modal: Personalizar Color */}
      <PersonalColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        homeId={home.id}
        currentColor={currentMemberColor}
        onSuccess={(newColor) => {
          if (currentUserId) {
            setMemberColorOverrides((prev) => ({ ...prev, [currentUserId]: newColor }));
          }
          onHomeUpdate?.();
          queryClient.invalidateQueries({ queryKey: ['chores', home.id] });
          queryClient.invalidateQueries({ queryKey: ['chores-leaderboard', home.id] });
        }}
      />
    </div>
  );
};
