import type { ReportReason, ReportStatus, ReportTargetType } from '../../report/types/report.types';

export type { ReportReason, ReportStatus, ReportTargetType };

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  adminNotes?: string;
  resolverId?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface ReportFilterCriteria {
  id?: string;
  query?: string;
  status?: ReportStatus | '';
  targetType?: ReportTargetType | '';
  targetId?: string;
  reporterId?: string;
  reason?: ReportReason | '';
  from?: string;
  to?: string;
}

export interface ReportStatusUpdateRequest {
  status: ReportStatus;
  adminNotes?: string;
}

export interface BulkReportStatusUpdateRequest {
  reportIds: string[];
  status: ReportStatus;
  adminNotes?: string;
}

export interface ReportTargetCount {
  targetId: string;
  targetType: ReportTargetType;
  pendingCount: number;
  totalCount: number;
  reportCount?: number;
}

export interface AdminUserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN' | 'TENANT' | 'OWNER';
  nickname: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  profilePicUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  bannedAt: string | null;
  bannedUntil: string | null;
  banReason: string | null;
}

export interface BanUserRequest {
  message: string;
  bannedUntil?: string | null;
}

export interface AdminListingFilters {
  id?: string;
  city?: string;
  rentalType?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  title?: string;
  hostId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}
