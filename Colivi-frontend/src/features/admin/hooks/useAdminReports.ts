import { useState, useEffect, useCallback } from 'react';
import { adminReportService } from '../services/adminReportService';
import type {
  ReportItem,
  ReportFilterCriteria,
  ReportStatus,
  PageResponse,
} from '../types/admin.types';

interface UseAdminReportsOptions {
  initialPageSize?: number;
  enabled?: boolean;
}

export const useAdminReports = (options: UseAdminReportsOptions | number = 10) => {
  const initialPageSize = typeof options === 'number' ? options : options.initialPageSize ?? 10;
  const enabled = typeof options === 'number' ? true : options.enabled ?? true;

  const [reportsPage, setReportsPage] = useState<PageResponse<ReportItem> | null>(null);
  const [filters, setFilters] = useState<ReportFilterCriteria>({});
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(initialPageSize);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  const fetchReports = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminReportService.listReports(filters, page, size);
      setReportsPage(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las denuncias.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, filters, page, size]);

  useEffect(() => {
    if (enabled) {
      fetchReports();
    }
  }, [enabled, fetchReports]);

  const setFilter = useCallback((key: keyof ReportFilterCriteria, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0); // Reset page on filter change
    setSelectedIds([]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(0);
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!reportsPage?.content) return;
    const allIds = reportsPage.content.map((r) => r.id);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }, [reportsPage]);

  const updateSingleStatus = async (id: string, status: ReportStatus, adminNotes?: string) => {
    try {
      const updated = await adminReportService.updateReportStatus(id, { status, adminNotes });
      setReportsPage((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((r) => (r.id === id ? updated : r)),
        };
      });
      if (activeReport?.id === id) {
        setActiveReport(updated);
      }
      return updated;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al actualizar estado.');
    }
  };

  const updateBulkStatus = async (status: ReportStatus, adminNotes?: string) => {
    if (selectedIds.length === 0) return;
    try {
      await adminReportService.updateBulkReportStatus({
        reportIds: selectedIds,
        status,
        adminNotes,
      });
      setSelectedIds([]);
      await fetchReports();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al procesar denuncias masivamente.');
    }
  };

  return {
    reports: reportsPage?.content || [],
    pageInfo: reportsPage,
    filters,
    page,
    size,
    isLoading,
    error,
    selectedIds,
    activeReport,
    setActiveReport,
    setPage,
    setSize,
    setFilter,
    resetFilters,
    toggleSelect,
    toggleSelectAll,
    updateSingleStatus,
    updateBulkStatus,
    refetch: fetchReports,
  };
};
