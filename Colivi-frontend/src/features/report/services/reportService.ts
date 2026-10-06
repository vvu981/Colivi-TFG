import api from '../../../lib/api';
import type {
  CreateReportRequest,
  ReportResponse,
  ReportFeedbackResponse,
} from '../types/report.types';

export const reportService = {
  /**
   * Submits a new report for an entity (listing, user).
   */
  createReport: async (payload: CreateReportRequest): Promise<ReportResponse> => {
    const { data } = await api.post<ReportResponse>('/reports', payload);
    return data;
  },

  /**
   * Retrieves pending resolution feedback/acknowledgments for the current user's submitted reports.
   */
  getPendingFeedback: async (): Promise<ReportFeedbackResponse[]> => {
    const { data } = await api.get<ReportFeedbackResponse[]>('/reports/pending-feedback');
    return data;
  },

  /**
   * Marks a report feedback notification as acknowledged/seen by the reporter.
   */
  acknowledgeFeedback: async (reportId: string): Promise<void> => {
    await api.patch(`/reports/${reportId}/acknowledge-feedback`);
  },
};

