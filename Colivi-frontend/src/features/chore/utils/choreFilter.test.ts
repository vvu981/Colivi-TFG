import { describe, it, expect } from 'vitest';
import {
  getChoreDateRanges,
  calculateStatusCounts,
  filterChores,
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
});
