import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminReportDetailModal } from './AdminReportDetailModal';
import { adminReportService } from '../../services/adminReportService';
import { adminListingService } from '../../services/adminListingService';
import type { ReportItem } from '../../types/admin.types';

vi.mock('../../services/adminReportService', () => ({
  adminReportService: {
    resolveAllReportsForTarget: vi.fn(),
  },
}));

vi.mock('../../services/adminListingService', () => ({
  adminListingService: {
    getListingById: vi.fn(),
    banListing: vi.fn(),
    hardDeleteListing: vi.fn(),
  },
}));

vi.mock('../../services/adminUserService', () => ({
  adminUserService: {
    getAdminUserProfile: vi.fn(),
    banUser: vi.fn(),
    deleteUserHard: vi.fn(),
  },
}));

describe('AdminReportDetailModal', () => {
  const mockReport: ReportItem = {
    id: 'report-123',
    reporterId: 'user-reporter-1',
    targetType: 'LISTING',
    targetId: 'listing-target-1',
    reason: 'FRAUD',
    description: 'Descripción de prueba de la denuncia',
    status: 'PENDING',
    createdAt: '2026-08-30T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminListingService.getListingById).mockResolvedValue({
      id: 'listing-target-1',
      title: 'Piso céntrico luminoso',
      description: 'Piso luminoso',
      pricePerMonth: 650,
      securityDeposit: 650,
      rentalType: 'ROOM',
      status: 'AVAILABLE',
      accommodation: {
        id: 'acc-1',
        ownerId: 'owner-1',
        ownerNickname: 'owner1',
        city: 'Madrid',
        address: 'Gran Vía 1',
        totalRooms: 3,
        totalBathrooms: 1,
        freeRooms: 1,
        squareMeters: 75,
        country: 'España',
        province: 'Madrid',
        latitude: 40.42,
        longitude: -3.7,
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: null,
        amenities: [],
        images: [],
      },
      hostId: 'owner-1',
      hostNickname: 'owner1',
      isPromoted: false,
      selectedImages: [],
      createdAt: '2026-01-01',
    });
  });

  it('renders report details and target snapshot', async () => {
    render(
      <AdminReportDetailModal
        report={mockReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Expediente de Denuncia')).toBeInTheDocument();
    expect(screen.getByText('user-reporter-1')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba de la denuncia')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Piso céntrico luminoso')).toBeInTheDocument();
    });
  });

  it('allows updating status to RESOLVED with admin notes', async () => {
    const handleStatusUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminReportDetailModal
        report={mockReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={handleStatusUpdate}
      />
    );

    const notesTextarea = screen.getByPlaceholderText(/Escribe las conclusiones de la moderación/i);
    fireEvent.change(notesTextarea, { target: { value: 'Comprobado y sancionado' } });

    const resolveBtn = screen.getByRole('button', { name: /^Resolver \(esta\)/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(handleStatusUpdate).toHaveBeenCalledWith(
        'report-123',
        'RESOLVED',
        'Comprobado y sancionado'
      );
    });
  });

  it('shows Desbanear button when target is already banned', async () => {
    vi.mocked(adminListingService.getListingById).mockResolvedValueOnce({
      id: 'listing-target-1',
      title: 'Piso céntrico luminoso',
      description: 'Piso luminoso',
      pricePerMonth: 650,
      securityDeposit: 650,
      rentalType: 'ROOM',
      status: 'BANNED',
      accommodation: null as any,
      hostId: 'owner-1',
      hostNickname: 'owner1',
      isPromoted: false,
      selectedImages: [],
      createdAt: '2026-01-01',
    });

    render(
      <AdminReportDetailModal
        report={mockReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Desbanear Anuncio/i })).toBeInTheDocument();
    });
  });

  it('cascades resolution to all open reports when banning a target (Option A)', async () => {
    const handleStatusUpdate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(adminListingService.banListing).mockResolvedValue(undefined);
    vi.mocked(adminReportService.resolveAllReportsForTarget).mockResolvedValue(undefined);

    render(
      <AdminReportDetailModal
        report={mockReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={handleStatusUpdate}
      />
    );

    const banBtn = screen.getByRole('button', { name: /Banear Anuncio/i });
    fireEvent.click(banBtn);

    expect(
      screen.getByText('¿Confirmar suspensión y baneo de este anuncio?')
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, banear y resolver denuncias/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminListingService.banListing).toHaveBeenCalledWith('listing-target-1');
      expect(adminReportService.resolveAllReportsForTarget).toHaveBeenCalledWith(
        'listing-target-1',
        expect.objectContaining({ status: 'RESOLVED' })
      );
      expect(handleStatusUpdate).toHaveBeenCalledWith(
        'report-123',
        'RESOLVED',
        expect.any(String)
      );
    });
  });

  it('resolves all open reports when clicking Resolver Todas del Objetivo (Option B)', async () => {
    const handleStatusUpdate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(adminReportService.resolveAllReportsForTarget).mockResolvedValue(undefined);

    render(
      <AdminReportDetailModal
        report={mockReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={handleStatusUpdate}
      />
    );

    const resolveAllBtn = screen.getByRole('button', { name: /Resolver Todas del Objetivo/i });
    fireEvent.click(resolveAllBtn);

    expect(
      screen.getByText('¿Resolver todas las denuncias abiertas de este anuncio?')
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, resolver todas en bloque/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminReportService.resolveAllReportsForTarget).toHaveBeenCalledWith(
        'listing-target-1',
        expect.objectContaining({ status: 'RESOLVED' })
      );
      expect(handleStatusUpdate).toHaveBeenCalledWith(
        'report-123',
        'RESOLVED',
        expect.any(String)
      );
    });
  });
});
