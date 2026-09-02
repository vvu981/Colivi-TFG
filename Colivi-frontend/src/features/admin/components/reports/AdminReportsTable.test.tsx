import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminReportsTable } from './AdminReportsTable';
import type { ReportItem } from '../../types/admin.types';

describe('AdminReportsTable', () => {
  const mockReports: ReportItem[] = [
    {
      id: '12345678-1234-1234-1234-123456789abc',
      reporterId: 'reporter-1',
      targetType: 'LISTING',
      targetId: 'listing-target-1',
      reason: 'FRAUD',
      description: 'Anuncio con precio falso',
      status: 'PENDING',
      createdAt: '2026-08-30T10:00:00Z',
    },
  ];

  it('renders report rows with reason and status badge', () => {
    render(
      <AdminReportsTable
        reports={mockReports}
        pageInfo={{
          content: mockReports,
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        page={0}
        size={10}
        isLoading={false}
        selectedIds={[]}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onSelectReport={vi.fn()}
        onBulkUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Fraude / Falso')).toBeInTheDocument();
    expect(screen.getByText('Anuncio con precio falso')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Anuncio')).toBeInTheDocument();
  });

  it('triggers onSelectReport when clicking Expediente button', () => {
    const handleSelect = vi.fn();
    render(
      <AdminReportsTable
        reports={mockReports}
        pageInfo={{
          content: mockReports,
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        page={0}
        size={10}
        isLoading={false}
        selectedIds={[]}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onSelectReport={handleSelect}
        onBulkUpdate={vi.fn()}
      />
    );

    const dossierBtn = screen.getByRole('button', { name: /Expediente/i });
    fireEvent.click(dossierBtn);

    expect(handleSelect).toHaveBeenCalledWith(mockReports[0]);
  });

  it('shows bulk action bar when reports are selected', () => {
    render(
      <AdminReportsTable
        reports={mockReports}
        pageInfo={{
          content: mockReports,
          totalElements: 1,
          totalPages: 1,
          size: 10,
          isLoading: false,
          number: 0,
        } as any}
        page={0}
        size={10}
        isLoading={false}
        selectedIds={['12345678-1234-1234-1234-123456789abc']}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
        onSelectReport={vi.fn()}
        onBulkUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('denuncias seleccionadas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aplicar Acción Masiva/i })).toBeInTheDocument();
  });
});
