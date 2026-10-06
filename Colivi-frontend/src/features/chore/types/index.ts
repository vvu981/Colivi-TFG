export type ChoreStatus = 'PENDING' | 'COMPLETED' | 'LATE_COMPLETED';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export type DeleteMode = 'DELETE_SINGLE' | 'DELETE_FORWARD';

export type ChoreTimeFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'LATE' | 'TODAY' | 'WEEK' | 'MONTH';

export interface ChoreResponseDto {
  id: string;
  seriesId: string | null;
  homeId: string;
  title: string;
  description: string | null;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string | null;
  assigneeColor?: string | null;
  completedById: string | null;
  completedByName: string | null;
  completedByAvatar: string | null;
  basePoints: number;
  dueDate: string; // YYYY-MM-DD
  status: ChoreStatus;
  completedAt: string | null;
  createdAt: string;
  isLate: boolean;
  canRescue: boolean;
  canComplete: boolean;
}

export type RotationType = 'FIXED' | 'ROUND_ROBIN';

export interface CreateChoreRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  basePoints: number;
  dueDate: string;
  recurrence?: RecurrenceType;
  occurrences?: number;
  customDaysOfWeek?: number[];
  rotationType?: RotationType;
  rotationUserIds?: string[];
}

export interface ChoreFilterParams {
  assigneeId?: string;
  status?: ChoreStatus;
  from?: string;
  to?: string;
  period?: string;
}

export interface UserChoreScoreDto {
  userId: string;
  nickname: string;
  fullName: string;
  profilePicUrl: string | null;
  currentPoints: number;
  expectedPoints: number;
  completedCount: number;
  rescuedCount: number;
  penalizedCount: number;
  pendingCount: number;
}

export interface ChoreLeaderboardDto {
  period: 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  scores: UserChoreScoreDto[];
}
