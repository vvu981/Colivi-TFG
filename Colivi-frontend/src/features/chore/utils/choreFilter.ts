import type { ChoreResponseDto } from '../types';
import type { ChoreFilters } from '../components/ChoreFilterDropdown';

export interface ChoreFilterDateRanges {
  todayStr: string;
  mondayStr: string;
  sundayStr: string;
  currentYearMonth: string;
}

export function getChoreDateRanges(referenceDate: Date = new Date()): ChoreFilterDateRanges {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const currentDay = referenceDate.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + diffToMonday);
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

  const currentYearMonth = `${year}-${month}`;

  return { todayStr, mondayStr, sundayStr, currentYearMonth };
}

/**
 * Deduplica las tareas pendientes no atrasadas pertenecientes a la misma serie recurrente,
 * conservando únicamente el turno más próximo (menor dueDate) y todas las atrasadas/rescatables.
 */
export function collapseSeriesOccurrences(
  chores: ChoreResponseDto[],
  showAllSeriesOccurrences: boolean = false
): ChoreResponseDto[] {
  if (showAllSeriesOccurrences) {
    return chores;
  }

  // 1. Identificar para cada seriesId la tarea pendiente no atrasada con menor dueDate
  const earliestNonLatePendingBySeries = new Map<string, string>(); // seriesId -> choreId

  for (const chore of chores) {
    if (chore.seriesId && chore.status === 'PENDING' && !chore.isLate) {
      const currentEarliestId = earliestNonLatePendingBySeries.get(chore.seriesId);
      if (!currentEarliestId) {
        earliestNonLatePendingBySeries.set(chore.seriesId, chore.id);
      } else {
        const currentEarliestChore = chores.find((c) => c.id === currentEarliestId);
        if (currentEarliestChore) {
          if (
            chore.dueDate < currentEarliestChore.dueDate ||
            (chore.dueDate === currentEarliestChore.dueDate && chore.id < currentEarliestChore.id)
          ) {
            earliestNonLatePendingBySeries.set(chore.seriesId, chore.id);
          }
        }
      }
    }
  }

  // 2. Conservar individuales, completadas, atrasadas y exclusivamente el turno más próximo de cada serie
  return chores.filter((chore) => {
    if (!chore.seriesId || chore.status !== 'PENDING' || chore.isLate) {
      return true;
    }
    const earliestId = earliestNonLatePendingBySeries.get(chore.seriesId);
    return chore.id === earliestId;
  });
}

/**
 * Calcula cuántos turnos futuros pendientes y no atrasados existen en la serie que suceden a la tarea dada.
 */
export function getSeriesFutureTurnsCount(
  chore: ChoreResponseDto,
  allChores: ChoreResponseDto[]
): number {
  if (!chore.seriesId || chore.status !== 'PENDING' || chore.isLate) {
    return 0;
  }

  return allChores.filter(
    (c) =>
      c.seriesId === chore.seriesId &&
      c.status === 'PENDING' &&
      !c.isLate &&
      (c.dueDate > chore.dueDate || (c.dueDate === chore.dueDate && c.id > chore.id))
  ).length;
}

export function calculateStatusCounts(
  chores: ChoreResponseDto[],
  filters: ChoreFilters,
  selectedUserId: string | null = null,
  referenceDate: Date = new Date()
): { ALL: number; PENDING: number; COMPLETED: number; LATE: number } {
  const { todayStr, mondayStr, sundayStr, currentYearMonth } = getChoreDateRanges(referenceDate);

  const userFiltered = selectedUserId
    ? chores.filter((c) => c.assigneeId === selectedUserId)
    : chores;

  const candidateChores = collapseSeriesOccurrences(
    userFiltered,
    Boolean(filters.showAllSeriesOccurrences)
  );

  const dateFiltered = candidateChores.filter((chore) => {
    if (filters.date === 'TODAY') return chore.dueDate === todayStr;
    if (filters.date === 'WEEK') return chore.dueDate >= mondayStr && chore.dueDate <= sundayStr;
    if (filters.date === 'MONTH') return chore.dueDate.startsWith(currentYearMonth);
    if (filters.date === 'CUSTOM') {
      if (filters.customStartDate && chore.dueDate < filters.customStartDate) return false;
      if (filters.customEndDate && chore.dueDate > filters.customEndDate) return false;
    }
    return true;
  });

  let pending = 0;
  let completed = 0;
  let late = 0;

  for (const chore of dateFiltered) {
    if (chore.status === 'PENDING') {
      pending++;
      if (chore.isLate) late++;
    } else {
      completed++;
    }
  }

  return {
    ALL: dateFiltered.length,
    PENDING: pending,
    COMPLETED: completed,
    LATE: late,
  };
}

export function filterChores(
  chores: ChoreResponseDto[],
  filters: ChoreFilters,
  selectedUserId: string | null = null,
  referenceDate: Date = new Date()
): ChoreResponseDto[] {
  const { todayStr, mondayStr, sundayStr, currentYearMonth } = getChoreDateRanges(referenceDate);

  const userFiltered = selectedUserId
    ? chores.filter((chore) => chore.assigneeId === selectedUserId)
    : chores;

  const candidateChores = collapseSeriesOccurrences(
    userFiltered,
    Boolean(filters.showAllSeriesOccurrences)
  );

  return candidateChores.filter((chore) => {
    // 1. Filtro acumulable por Estado
    if (filters.status === 'PENDING') {
      if (chore.status !== 'PENDING') return false;
    } else if (filters.status === 'COMPLETED') {
      if (chore.status !== 'COMPLETED' && chore.status !== 'LATE_COMPLETED') return false;
    } else if (filters.status === 'LATE') {
      if (!(chore.isLate && chore.status === 'PENDING')) return false;
    }

    // 2. Filtro acumulable por Fecha
    if (filters.date === 'TODAY') {
      if (chore.dueDate !== todayStr) return false;
    } else if (filters.date === 'WEEK') {
      if (chore.dueDate < mondayStr || chore.dueDate > sundayStr) return false;
    } else if (filters.date === 'MONTH') {
      if (!chore.dueDate.startsWith(currentYearMonth)) return false;
    } else if (filters.date === 'CUSTOM') {
      if (filters.customStartDate && chore.dueDate < filters.customStartDate) return false;
      if (filters.customEndDate && chore.dueDate > filters.customEndDate) return false;
    }

    return true;
  });
}
