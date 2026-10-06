import api from '../../../lib/api';
import type {
  ReportItem,
  ReportFilterCriteria,
  ReportStatusUpdateRequest,
  BulkReportStatusUpdateRequest,
  ReportTargetCount,
  ReportTargetType,
  PageResponse,
} from '../types/admin.types';

export const adminReportService = {
  /**
   * Lists and filters reports with pagination and sorting.
   */
  listReports: async (
    criteria: ReportFilterCriteria = {},
    page = 0,
    size = 10
  ): Promise<PageResponse<ReportItem>> => {
    const params = new URLSearchParams();
    if (criteria.id) params.append('id', criteria.id);
    if (criteria.query) params.append('query', criteria.query);
    if (criteria.status) params.append('status', criteria.status);
    if (criteria.targetType) params.append('targetType', criteria.targetType);
    if (criteria.targetId) params.append('targetId', criteria.targetId);
    if (criteria.reporterId) params.append('reporterId', criteria.reporterId);
    if (criteria.reason) params.append('reason', criteria.reason);
    if (criteria.from) params.append('from', criteria.from);
    if (criteria.to) params.append('to', criteria.to);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const { data } = await api.get<PageResponse<ReportItem>>(`/admin/reports?${params.toString()}`);
    return data;
  },

  /**
   * Retrieves a single report dossier by ID.
   */
  getReportById: async (id: string): Promise<ReportItem> => {
    const { data } = await api.get<ReportItem>(`/admin/reports/${id}`);
    return data;
  },

  /**
   * Updates status of a single report with optional admin notes.
   */
  updateReportStatus: async (
    id: string,
    payload: ReportStatusUpdateRequest
  ): Promise<ReportItem> => {
    const { data } = await api.patch<ReportItem>(`/admin/reports/${id}/status`, payload);
    return data;
  },

  /**
   * Updates status of multiple reports in a single atomic batch.
   */
  updateBulkReportStatus: async (
    payload: BulkReportStatusUpdateRequest
  ): Promise<void> => {
    await api.patch('/admin/reports/bulk-status', payload);
  },

  /**
   * Resolves or dismisses all open reports for a specific target ID in cascade.
   */
  resolveAllReportsForTarget: async (
    targetId: string,
    payload: ReportStatusUpdateRequest
  ): Promise<void> => {
    await api.patch(`/admin/reports/target/${targetId}/resolve-all`, payload);
  },

  /**
   * Retrieves most reported targets ranked by report count.
   */
  getMostReportedTargets: async (
    type?: ReportTargetType,
    page = 0,
    size = 10
  ): Promise<PageResponse<ReportTargetCount>> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const { data } = await api.get<PageResponse<ReportTargetCount>>(
      `/admin/reports/most-reported?${params.toString()}`
    );
    return data;
  },
};
