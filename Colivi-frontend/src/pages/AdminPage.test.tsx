import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from './AdminPage';
import * as AuthContextModule from '../features/auth/context/AuthContext';
import { adminReportService } from '../features/admin/services/adminReportService';
import { adminListingService } from '../features/admin/services/adminListingService';
import { adminUserService } from '../features/admin/services/adminUserService';

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/admin/services/adminReportService', () => ({
  adminReportService: {
    listReports: vi.fn(),
    getReportById: vi.fn(),
    updateReportStatus: vi.fn(),
    updateBulkReportStatus: vi.fn(),
    getMostReportedTargets: vi.fn(),
  },
}));

vi.mock('../features/admin/services/adminListingService', () => ({
  adminListingService: {
    searchAllListings: vi.fn(),
    banListing: vi.fn(),
    unbanListing: vi.fn(),
    hardDeleteListing: vi.fn(),
    recoverListing: vi.fn(),
    getListingById: vi.fn(),
  },
}));

vi.mock('../features/admin/services/adminUserService', () => ({
  adminUserService: {
    searchUsers: vi.fn(),
    getAdminUserProfile: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    deleteUserHard: vi.fn(),
    setAdmin: vi.fn(),
  },
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@colivi.com',
        phone: null,
        role: 'ADMIN',
        nickname: 'superadmin',
        firstName: 'Super',
        lastName1: 'Admin',
        lastName2: null,
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'admin-jwt',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(adminReportService.listReports).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });

    vi.mocked(adminReportService.getMostReportedTargets).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });

    vi.mocked(adminListingService.searchAllListings).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });

    vi.mocked(adminUserService.searchUsers).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });
  });

  it('renders the portal title and navigation tabs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Portal de Moderación y Administración')).toBeInTheDocument();
    expect(screen.getAllByText('Denuncias').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Anuncios').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Usuarios').length).toBeGreaterThan(0);
  });

  it('switches between tabs on tab button click', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
    });

    // Initial tab is Denuncias
    expect(screen.getByText('Filtros de Búsqueda')).toBeInTheDocument();

    // Click Anuncios tab
    const listingsTabs = screen.getAllByRole('button', { name: /Anuncios/i });
    await act(async () => {
      fireEvent.click(listingsTabs[0]);
    });

    expect(await screen.findByText('Filtros de Anuncios')).toBeInTheDocument();

    // Click Usuarios tab
    const usersTabs = screen.getAllByRole('button', { name: /Usuarios/i });
    await act(async () => {
      fireEvent.click(usersTabs[0]);
    });

    expect(await screen.findByText('Filtros de Usuarios')).toBeInTheDocument();

    // Click Estadísticas tab
    const statsTabs = screen.getAllByRole('button', { name: /Estadísticas/i });
    await act(async () => {
      fireEvent.click(statsTabs[0]);
    });

    expect(await screen.findByText('Ranking de Elementos Más Denunciados')).toBeInTheDocument();
  });

  it('navigates to listings tab and pre-fills id/title filter when clicking a listing in ranking', async () => {
    vi.mocked(adminReportService.getMostReportedTargets).mockImplementation(async (type) => {
      if (type === 'LISTING') {
        return {
          content: [
            {
              targetId: 'listing-uuid-123',
              targetType: 'LISTING',
              pendingCount: 4,
              totalCount: 6,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        };
      }
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
      };
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
    });

    // Go to stats tab
    const statsTabs = screen.getAllByRole('button', { name: /Estadísticas/i });
    await act(async () => {
      fireEvent.click(statsTabs[0]);
    });

    // Wait for the ranking item to appear
    const rankingItem = await screen.findByText(/listing-uuid-123/i);
    expect(rankingItem).toBeInTheDocument();

    // Click on the ranking item row
    const listingRowLabel = await screen.findByText('Anuncio (Listing)');
    await act(async () => {
      fireEvent.click(listingRowLabel);
    });

    // Verify redirected to Anuncios tab and input has the listing ID
    expect(await screen.findByText('Filtros de Anuncios')).toBeInTheDocument();
    const idInput = screen.getByPlaceholderText('ID o título...') as HTMLInputElement;
    expect(idInput.value).toBe('listing-uuid-123');
  });
});
