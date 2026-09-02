import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PublicProfileView } from './PublicProfileView';
import * as usePublicProfileHook from '../hooks/usePublicProfile';
import * as AuthContextModule from '../../auth/context/AuthContext';
import type { PublicUserProfile } from '../types/user.types';
import type { AccommodationListingResponse } from '../../housing/types/listing.types';

vi.mock('../hooks/usePublicProfile', () => ({
  usePublicProfile: vi.fn(),
}));

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PublicProfileView', () => {
  const mockUser: PublicUserProfile = {
    id: 'user-123',
    nickname: 'alberto_c',
    firstName: 'Alberto',
    lastName1: 'Castillo',
    lastName2: 'Ruiz',
    profilePicUrl: 'https://example.com/alberto.jpg',
    createdAt: '2024-03-10T10:00:00Z',
  };

  const mockListings: AccommodationListingResponse[] = [
    {
      id: 'listing-abc',
      title: 'Habitación luminosa en Moncloa',
      description: 'Cerca de universidades',
      pricePerMonth: 500,
      securityDeposit: 500,
      status: 'AVAILABLE',
      rentalType: 'ROOM',
      createdAt: '2024-04-01T10:00:00Z',
      accommodation: {
        id: 'acc-1',
        title: 'Piso Moncloa',
        address: 'Calle Princesa 25',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
        totalRooms: 3,
        totalBathrooms: 2,
        squareMeters: 90,
        propertyType: 'FLAT',
        images: [],
      } as any,
      hostId: 'user-123',
      hostNickname: 'alberto_c',
      hostProfilePicUrl: 'https://example.com/alberto.jpg',
      isPromoted: true,
      selectedImages: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });
  });

  const renderComponent = (userId = 'user-123') => {
    return render(
      <BrowserRouter>
        <PublicProfileView userId={userId} />
      </BrowserRouter>
    );
  };

  it('muestra el estado de carga correctamente', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: null,
      listings: [],
      isLoading: true,
      error: null,
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText(/cargando perfil de usuario/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error si el usuario no existe', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: null,
      listings: [],
      isLoading: false,
      error: 'El usuario solicitado no existe o no está disponible.',
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent('non-existent');

    expect(screen.getByRole('heading', { name: /perfil no disponible/i })).toBeInTheDocument();
    expect(screen.getByText(/el usuario solicitado no existe/i)).toBeInTheDocument();

    // Botón volver
    const backBtn = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('renderiza la información completa del perfil y sus anuncios', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: mockUser,
      listings: mockListings,
      isLoading: false,
      error: null,
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent();

    // Header info
    expect(screen.getByRole('heading', { name: /Alberto Castillo Ruiz/i })).toBeInTheDocument();
    expect(screen.getByText(/@alberto_c/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cuenta activa/i).length).toBeGreaterThanOrEqual(1);

    // Stats & Section Header
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/alojamiento publicado/i)).toBeInTheDocument();

    // Listings
    expect(screen.getByText(/Habitación luminosa en Moncloa/i)).toBeInTheDocument();
    expect(screen.getByText(/500 €/i)).toBeInTheDocument();

    // Report button
    expect(screen.getByRole('button', { name: /denunciar usuario/i })).toBeInTheDocument();
  });

  it('muestra banner y botón de edición cuando se visualiza el propio perfil', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: mockUser,
      listings: mockListings,
      isLoading: false,
      error: null,
      isSelf: true,
      refetch: vi.fn(),
    });

    renderComponent();

    // Self banner
    expect(screen.getByText(/modo vista previa/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /editar mi perfil/i })).toBeInTheDocument();

    // Report button should not appear
    expect(screen.queryByRole('button', { name: /denunciar usuario/i })).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando el usuario no tiene anuncios publicados', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: mockUser,
      listings: [],
      isLoading: false,
      error: null,
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText(/sin alojamientos publicados/i)).toBeInTheDocument();
    expect(screen.getByText(/@alberto_c aún no tiene ningún alojamiento publicado/i)).toBeInTheDocument();
  });

  it('abre el modal de denuncia al pulsar el botón correspondiente', () => {
    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: mockUser,
      listings: mockListings,
      isLoading: false,
      error: null,
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent();

    const reportBtn = screen.getByRole('button', { name: /denunciar usuario/i });
    fireEvent.click(reportBtn);

    expect(screen.getByRole('heading', { name: /denunciar usuario/i })).toBeInTheDocument();
  });

  it('muestra el badge de administración con el ID para copiar si el usuario autenticado es ADMIN', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@colivi.com',
        phone: null,
        role: 'ADMIN',
        nickname: 'admin',
        firstName: 'Admin',
        lastName1: 'Super',
        lastName2: null,
        profilePicUrl: null,
        createdAt: '2026-01-01',
      },
      token: 'admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(usePublicProfileHook.usePublicProfile).mockReturnValue({
      user: mockUser,
      listings: mockListings,
      isLoading: false,
      error: null,
      isSelf: false,
      refetch: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText('ADMIN:')).toBeInTheDocument();
    expect(screen.getByText('user-123')).toBeInTheDocument();
  });
});
