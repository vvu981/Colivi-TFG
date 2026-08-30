import api from '../../../lib/api';
import type {
  CreateReportRequest,
  ReportResponse,
  PageResponse,
} from '../types/report.types';

export const reportService = {
  /**
   * Submits a new report for an entity (listing, user, home, expense).
   */
  createReport: async (payload: CreateReportRequest): Promise<ReportResponse> => {
    const { data } = await api.post<ReportResponse>('/reports', payload);
    return data;
  },

  /**
   * Retrieves the paginated reports submitted by the currently authenticated user.
   */
  getMyReports: async (page = 0, size = 10): Promise<PageResponse<ReportResponse>> => {
    const { data } = await api.get<PageResponse<ReportResponse>>('/reports/me', {
      params: { page, size },
    });
    return data;
  },

  /**
   * Cancels a pending report created by the authenticated user.
   */
  cancelReport: async (reportId: string): Promise<void> => {
    await api.patch(`/reports/${reportId}/cancel`);
  },
};
