import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { adminReportService } from './adminReportService';

vi.mock('../../../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listReports calls /admin/reports with filter query parameters and pagination', async () => {
    const mockPage = {
      content: [{ id: 'rep-1', status: 'PENDING', targetType: 'LISTING' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const result = await adminReportService.listReports(
      { status: 'PENDING', targetType: 'LISTING' },
      0,
      10
    );

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reports?status=PENDING&targetType=LISTING&page=0&size=10')
    );
    expect(result).toEqual(mockPage);
  });

  it('getReportById calls /admin/reports/:id', async () => {
    const mockReport = { id: 'rep-1', status: 'PENDING' };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockReport });

    const result = await adminReportService.getReportById('rep-1');

    expect(api.get).toHaveBeenCalledWith('/admin/reports/rep-1');
    expect(result).toEqual(mockReport);
  });

  it('updateReportStatus sends PATCH to /admin/reports/:id/status', async () => {
    const mockUpdated = { id: 'rep-1', status: 'RESOLVED', adminNotes: 'Resuelto' };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockUpdated });

    const result = await adminReportService.updateReportStatus('rep-1', {
      status: 'RESOLVED',
      adminNotes: 'Resuelto',
    });

    expect(api.patch).toHaveBeenCalledWith('/admin/reports/rep-1/status', {
      status: 'RESOLVED',
      adminNotes: 'Resuelto',
    });
    expect(result).toEqual(mockUpdated);
  });

  it('updateBulkReportStatus sends PATCH to /admin/reports/bulk-status', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminReportService.updateBulkReportStatus({
      reportIds: ['r-1', 'r-2'],
      status: 'INVESTIGATING',
      adminNotes: 'Investigando lote',
    });

    expect(api.patch).toHaveBeenCalledWith('/admin/reports/bulk-status', {
      reportIds: ['r-1', 'r-2'],
      status: 'INVESTIGATING',
      adminNotes: 'Investigando lote',
    });
  });

  it('getMostReportedTargets calls /admin/reports/most-reported', async () => {
    const mockPage = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const result = await adminReportService.getMostReportedTargets('LISTING', 0, 10);

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/reports/most-reported?type=LISTING&page=0&size=10')
    );
    expect(result).toEqual(mockPage);
  });
});
