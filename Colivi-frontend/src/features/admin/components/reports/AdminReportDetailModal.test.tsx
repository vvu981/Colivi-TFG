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

vi.mock('../../services/adminConversationService', () => ({
  adminConversationService: {
    getConversationDossier: vi.fn(),
  },
}));
import { adminConversationService } from '../../services/adminConversationService';
import { adminUserService } from '../../services/adminUserService';

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

  it('renders conversation dossier with listing snippet, tenant, host, and messages when targetType is CONVERSATION', async () => {
    const conversationReport: ReportItem = {
      id: 'report-conv-1',
      reporterId: 'user-tenant-1',
      targetType: 'CONVERSATION',
      targetId: 'conv-123',
      reason: 'HARASSMENT',
      description: 'El propietario envía mensajes ofensivos',
      status: 'PENDING',
      createdAt: '2026-09-07T12:00:00Z',
    };

    vi.mocked(adminConversationService.getConversationDossier).mockResolvedValueOnce({
      conversationId: 'conv-123',
      listing: {
        id: 'listing-1',
        title: 'Estudio moderno en Chamberí',
        thumbnailUrl: null,
        city: 'Madrid',
        pricePerMonth: 800,
        rentalType: 'WHOLE_PLACE',
        status: 'AVAILABLE',
      },
      tenant: {
        id: 'user-tenant-1',
        firstName: 'Lucía',
        lastName: 'Fernández',
        nickname: 'luciaf',
        email: 'lucia@example.com',
        profilePicUrl: null,
        role: 'TENANT',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      host: {
        id: 'user-host-1',
        firstName: 'Marcos',
        lastName: 'Propietario',
        nickname: 'marcosh',
        email: 'marcos@example.com',
        profilePicUrl: null,
        role: 'OWNER',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          senderId: 'user-tenant-1',
          senderName: 'Lucía Fernández',
          content: 'Hola, sigue libre?',
          messageType: 'USER_MESSAGE',
          status: 'READ',
          createdAt: '2026-09-07T12:05:00Z',
          readAt: '2026-09-07T12:06:00Z',
          isMine: false,
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          senderId: 'user-host-1',
          senderName: 'Marcos Propietario',
          content: 'Sí, pero el precio ha subido a 1000.',
          messageType: 'USER_MESSAGE',
          status: 'READ',
          createdAt: '2026-09-07T12:10:00Z',
          readAt: '2026-09-07T12:11:00Z',
          isMine: false,
        },
      ],
      activeBooking: null,
      createdAt: '2026-09-07T12:00:00Z',
      lastMessageAt: '2026-09-07T12:10:00Z',
      isReported: true,
    });

    render(
      <AdminReportDetailModal
        report={conversationReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Expediente de Denuncia')).toBeInTheDocument();
    expect(screen.getByText('Conversación Denunciada')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Estudio moderno en Chamberí')).toBeInTheDocument();
      expect(screen.getByText('Lucía Fernández')).toBeInTheDocument();
      expect(screen.getByText('Marcos Propietario')).toBeInTheDocument();
      expect(screen.getByText('Hola, sigue libre?')).toBeInTheDocument();
      expect(screen.getByText('Sí, pero el precio ha subido a 1000.')).toBeInTheDocument();
    });

    // Verify disciplinary section on target is hidden for conversation (ban buttons are on user cards)
    expect(screen.queryByText(/Acciones Disciplinarias sobre el Objetivo/i)).not.toBeInTheDocument();
  });

  it('allows banning an involved user directly from conversation dossier', async () => {
    const conversationReport: ReportItem = {
      id: 'report-conv-1',
      reporterId: 'user-tenant-1',
      targetType: 'CONVERSATION',
      targetId: 'conv-123',
      reason: 'HARASSMENT',
      description: 'El propietario envía mensajes ofensivos',
      status: 'PENDING',
      createdAt: '2026-09-07T12:00:00Z',
    };

    vi.mocked(adminConversationService.getConversationDossier).mockResolvedValueOnce({
      conversationId: 'conv-123',
      listing: {
        id: 'listing-1',
        title: 'Estudio en Chamberí',
        thumbnailUrl: null,
        city: 'Madrid',
        pricePerMonth: 800,
        rentalType: 'WHOLE_PLACE',
        status: 'AVAILABLE',
      },
      tenant: {
        id: 'user-tenant-1',
        firstName: 'Lucía',
        lastName: 'Fernández',
        nickname: 'luciaf',
        email: 'lucia@example.com',
        profilePicUrl: null,
        role: 'TENANT',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      host: {
        id: 'user-host-1',
        firstName: 'Marcos',
        lastName: 'Propietario',
        nickname: 'marcosh',
        email: 'marcos@example.com',
        profilePicUrl: null,
        role: 'OWNER',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      messages: [],
      activeBooking: null,
      createdAt: '2026-09-07T12:00:00Z',
      lastMessageAt: null,
      isReported: true,
    });
    vi.mocked(adminUserService.banUser).mockResolvedValueOnce(undefined);

    render(
      <AdminReportDetailModal
        report={conversationReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Marcos Propietario')).toBeInTheDocument();
    });

    // Find the ban button for Marcos Propietario (there are 2 ban buttons: one for tenant, one for host)
    const banButtons = screen.getAllByRole('button', { name: /^Banear$/i });
    expect(banButtons.length).toBe(2);
    // Click the second one (host)
    fireEvent.click(banButtons[1]);

    expect(screen.getByText('¿Confirmar baneo de Marcos Propietario?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, banear usuario/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminUserService.banUser).toHaveBeenCalledWith(
        'user-host-1',
        expect.objectContaining({ message: expect.any(String) })
      );
      expect(screen.getByText('Usuario sancionado y baneado con éxito.')).toBeInTheDocument();
    });
  });

  it('safely handles banning when one of the participants is null (deleted user)', async () => {
    const conversationReport: ReportItem = {
      id: 'report-conv-2',
      reporterId: 'user-reporter-1',
      targetType: 'CONVERSATION',
      targetId: 'conv-456',
      reason: 'SPAM',
      description: 'Conversación con usuario eliminado',
      status: 'PENDING',
      createdAt: '2026-09-07T12:00:00Z',
    };

    vi.mocked(adminConversationService.getConversationDossier).mockResolvedValueOnce({
      conversationId: 'conv-456',
      listing: null,
      tenant: null, // Hard deleted tenant
      host: {
        id: 'user-host-2',
        firstName: 'Carlos',
        lastName: 'Host',
        nickname: 'carlosh',
        email: 'carlos@example.com',
        profilePicUrl: null,
        role: 'OWNER',
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
      messages: [],
      activeBooking: null,
      createdAt: '2026-09-07T12:00:00Z',
      lastMessageAt: null,
      isReported: true,
    });
    vi.mocked(adminUserService.banUser).mockResolvedValueOnce(undefined);

    render(
      <AdminReportDetailModal
        report={conversationReport}
        isOpen={true}
        onClose={vi.fn()}
        onStatusUpdate={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Carlos Host')).toBeInTheDocument();
      expect(screen.getByText('Inquilino no disponible o cuenta eliminada')).toBeInTheDocument();
    });

    const banBtn = screen.getByRole('button', { name: /^Banear$/i });
    fireEvent.click(banBtn);

    const confirmBtn = screen.getByRole('button', { name: /Sí, banear usuario/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminUserService.banUser).toHaveBeenCalledWith(
        'user-host-2',
        expect.objectContaining({ message: expect.any(String) })
      );
      expect(screen.getByText('Usuario sancionado y baneado con éxito.')).toBeInTheDocument();
    });
  });
});

