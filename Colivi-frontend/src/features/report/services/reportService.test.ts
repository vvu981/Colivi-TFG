import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { reportService } from './reportService';
import type { CreateReportRequest, ReportFeedbackResponse, ReportResponse } from '../types/report.types';

vi.mock('../../../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createReport sends POST request with correct payload', async () => {
    const payload: CreateReportRequest = {
      targetType: 'LISTING',
      targetId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'FRAUD',
      description: 'Anuncio fraudulento con precio incorrecto',
    };

    const mockResponse: ReportResponse = {
      id: 'report-uuid-1',
      reporterId: 'user-uuid-1',
      targetType: 'LISTING',
      targetId: payload.targetId,
      reason: 'FRAUD',
      description: payload.description,
      status: 'PENDING',
      createdAt: '2026-08-30T12:00:00Z',
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await reportService.createReport(payload);

    expect(api.post).toHaveBeenCalledWith('/reports', payload);
    expect(result).toEqual(mockResponse);
  });

  it('getPendingFeedback sends GET request to pending-feedback endpoint', async () => {
    const mockFeedbackList: ReportFeedbackResponse[] = [
      {
        id: 'report-uuid-1',
        targetType: 'LISTING',
        reason: 'FRAUD',
        resolvedAt: '2026-08-30T15:00:00Z',
      },
    ];

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockFeedbackList });

    const result = await reportService.getPendingFeedback();

    expect(api.get).toHaveBeenCalledWith('/reports/pending-feedback');
    expect(result).toEqual(mockFeedbackList);
  });

  it('acknowledgeFeedback sends PATCH request to acknowledge-feedback endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await reportService.acknowledgeFeedback('report-uuid-1');

    expect(api.patch).toHaveBeenCalledWith('/reports/report-uuid-1/acknowledge-feedback');
  });
});
