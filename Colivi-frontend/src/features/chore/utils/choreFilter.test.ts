import { describe, it, expect } from 'vitest';
import {
  getChoreDateRanges,
  calculateStatusCounts,
  filterChores,
  collapseSeriesOccurrences,
  getSeriesFutureTurnsCount,
} from './choreFilter';
import type { ChoreResponseDto } from '../types';

describe('choreFilter', () => {
  const referenceDate = new Date('2026-09-09T12:00:00Z'); // Wednesday

  const mockChores: ChoreResponseDto[] = [
    {
      id: 'c1',
      seriesId: null,
      homeId: 'h1',
      title: 'Tarea Hoy',
      description: null,
      assigneeId: 'u1',
      assigneeName: 'User 1',
      assigneeAvatar: null,
      completedById: null,
      completedByName: null,
      completedByAvatar: null,
      basePoints: 10,
      dueDate: '2026-09-09',
      status: 'PENDING',
      completedAt: null,
      createdAt: '2026-09-01T10:00:00Z',
      isLate: false,
      canRescue: false,
      canComplete: true,
    },
    {
      id: 'c2',
      seriesId: null,
      homeId: 'h1',
      title: 'Tarea Atrasada',
      description: null,
      assigneeId: 'u2',
      assigneeName: 'User 2',
      assigneeAvatar: null,
      completedById: null,
      completedByName: null,
      completedByAvatar: null,
      basePoints: 15,
      dueDate: '2026-09-07',
      status: 'PENDING',
      completedAt: null,
      createdAt: '2026-09-01T10:00:00Z',
      isLate: true,
      canRescue: true,
      canComplete: true,
    },
    {
      id: 'c3',
      seriesId: null,
      homeId: 'h1',
      title: 'Tarea Completada Mes Pasado',
      description: null,
      assigneeId: 'u1',
      assigneeName: 'User 1',
      assigneeAvatar: null,
      completedById: 'u1',
      completedByName: 'User 1',
      completedByAvatar: null,
      basePoints: 20,
      dueDate: '2026-08-25',
      status: 'COMPLETED',
      completedAt: '2026-08-25T12:00:00Z',
      createdAt: '2026-08-20T10:00:00Z',
      isLate: false,
      canRescue: false,
      canComplete: false,
    },
  ];

  it('calculates reference date ranges correctly', () => {
    const ranges = getChoreDateRanges(referenceDate);
    expect(ranges.todayStr).toBe('2026-09-09');
    expect(ranges.mondayStr).toBe('2026-09-07');
    expect(ranges.sundayStr).toBe('2026-09-13');
    expect(ranges.currentYearMonth).toBe('2026-09');
  });

  it('filters chores by status correctly', () => {
    const pending = filterChores(
      mockChores,
      { status: 'PENDING', date: 'ALL' },
      null,
      referenceDate
    );
    expect(pending.map((c) => c.id)).toEqual(['c1', 'c2']);

    const late = filterChores(
      mockChores,
      { status: 'LATE', date: 'ALL' },
      null,
      referenceDate
    );
    expect(late.map((c) => c.id)).toEqual(['c2']);

    const completed = filterChores(
      mockChores,
      { status: 'COMPLETED', date: 'ALL' },
      null,
      referenceDate
    );
    expect(completed.map((c) => c.id)).toEqual(['c3']);
  });

  it('filters chores by date and user simultaneously', () => {
    const todayUser1 = filterChores(
      mockChores,
      { status: 'ALL', date: 'TODAY' },
      'u1',
      referenceDate
    );
    expect(todayUser1.map((c) => c.id)).toEqual(['c1']);

    const weekChores = filterChores(
      mockChores,
      { status: 'ALL', date: 'WEEK' },
      null,
      referenceDate
    );
    expect(weekChores.map((c) => c.id)).toEqual(['c1', 'c2']);

    const customRange = filterChores(
      mockChores,
      { status: 'ALL', date: 'CUSTOM', customStartDate: '2026-08-01', customEndDate: '2026-08-31' },
      null,
      referenceDate
    );
    expect(customRange.map((c) => c.id)).toEqual(['c3']);
  });

  it('calculates status counts matching active date and user filters', () => {
    const counts = calculateStatusCounts(
      mockChores,
      { status: 'ALL', date: 'WEEK' },
      null,
      referenceDate
    );
    expect(counts).toEqual({
      ALL: 2,
      PENDING: 2,
      COMPLETED: 0,
      LATE: 1,
    });
  });

  describe('recurring series collapsing', () => {
    const seriesChores: ChoreResponseDto[] = [
      {
        id: 's-late',
        seriesId: 'series-clean',
        homeId: 'h1',
        title: 'Limpiar baño',
        description: null,
        assigneeId: 'u1',
        assigneeName: 'User 1',
        assigneeAvatar: null,
        completedById: null,
        completedByName: null,
        completedByAvatar: null,
        basePoints: 10,
        dueDate: '2026-09-02',
        status: 'PENDING',
        completedAt: null,
        createdAt: '2026-09-01T10:00:00Z',
        isLate: true,
        canRescue: true,
        canComplete: true,
      },
      {
        id: 's-turn-1',
        seriesId: 'series-clean',
        homeId: 'h1',
        title: 'Limpiar baño',
        description: null,
        assigneeId: 'u2',
        assigneeName: 'User 2',
        assigneeAvatar: null,
        completedById: null,
        completedByName: null,
        completedByAvatar: null,
        basePoints: 10,
        dueDate: '2026-09-09',
        status: 'PENDING',
        completedAt: null,
        createdAt: '2026-09-01T10:00:00Z',
        isLate: false,
        canRescue: false,
        canComplete: true,
      },
      {
        id: 's-turn-2',
        seriesId: 'series-clean',
        homeId: 'h1',
        title: 'Limpiar baño',
        description: null,
        assigneeId: 'u3',
        assigneeName: 'User 3',
        assigneeAvatar: null,
        completedById: null,
        completedByName: null,
        completedByAvatar: null,
        basePoints: 10,
        dueDate: '2026-09-16',
        status: 'PENDING',
        completedAt: null,
        createdAt: '2026-09-01T10:00:00Z',
        isLate: false,
        canRescue: false,
        canComplete: false,
      },
      {
        id: 's-turn-3',
        seriesId: 'series-clean',
        homeId: 'h1',
        title: 'Limpiar baño',
        description: null,
        assigneeId: 'u1',
        assigneeName: 'User 1',
        assigneeAvatar: null,
        completedById: null,
        completedByName: null,
        completedByAvatar: null,
        basePoints: 10,
        dueDate: '2026-09-23',
        status: 'PENDING',
        completedAt: null,
        createdAt: '2026-09-01T10:00:00Z',
        isLate: false,
        canRescue: false,
        canComplete: false,
      },
      {
        id: 's-completed',
        seriesId: 'series-clean',
        homeId: 'h1',
        title: 'Limpiar baño',
        description: null,
        assigneeId: 'u1',
        assigneeName: 'User 1',
        assigneeAvatar: null,
        completedById: 'u1',
        completedByName: 'User 1',
        completedByAvatar: null,
        basePoints: 10,
        dueDate: '2026-08-26',
        status: 'COMPLETED',
        completedAt: '2026-08-26T12:00:00Z',
        createdAt: '2026-08-20T10:00:00Z',
        isLate: false,
        canRescue: false,
        canComplete: false,
      },
    ];

    it('collapses future pending turns keeping only late turns and the earliest non-late turn', () => {
      const collapsed = collapseSeriesOccurrences(seriesChores, false);
      const ids = collapsed.map((c) => c.id);
      expect(ids).toContain('s-late');
      expect(ids).toContain('s-turn-1');
      expect(ids).toContain('s-completed');
      expect(ids).not.toContain('s-turn-2');
      expect(ids).not.toContain('s-turn-3');
    });

    it('returns all occurrences when showAllSeriesOccurrences is true', () => {
      const all = collapseSeriesOccurrences(seriesChores, true);
      expect(all.length).toBe(seriesChores.length);
      expect(all.map((c) => c.id)).toEqual(['s-late', 's-turn-1', 's-turn-2', 's-turn-3', 's-completed']);
    });

    it('correctly calculates future turns count for a given turn in the series', () => {
      const countTurn1 = getSeriesFutureTurnsCount(seriesChores[1], seriesChores);
      expect(countTurn1).toBe(2); // s-turn-2 and s-turn-3

      const countTurn2 = getSeriesFutureTurnsCount(seriesChores[2], seriesChores);
      expect(countTurn2).toBe(1); // s-turn-3

      const countTurn3 = getSeriesFutureTurnsCount(seriesChores[3], seriesChores);
      expect(countTurn3).toBe(0);

      const countLate = getSeriesFutureTurnsCount(seriesChores[0], seriesChores);
      expect(countLate).toBe(0); // late turns do not count future turns
    });

    it('integrates series collapsing with filterChores and calculateStatusCounts', () => {
      const defaultFiltered = filterChores(
        seriesChores,
        { status: 'ALL', date: 'ALL' },
        null,
        referenceDate
      );
      expect(defaultFiltered.map((c) => c.id)).toEqual(['s-late', 's-turn-1', 's-completed']);

      const counts = calculateStatusCounts(
        seriesChores,
        { status: 'ALL', date: 'ALL' },
        null,
        referenceDate
      );
      expect(counts).toEqual({
        ALL: 3, // s-late, s-turn-1, s-completed
        PENDING: 2, // s-late and s-turn-1
        COMPLETED: 1, // s-completed
        LATE: 1, // s-late
      });

      const allFiltered = filterChores(
        seriesChores,
        { status: 'ALL', date: 'ALL', showAllSeriesOccurrences: true },
        null,
        referenceDate
      );
      expect(allFiltered.length).toBe(5);
    });
  });
});
