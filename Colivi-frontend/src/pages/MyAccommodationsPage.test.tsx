import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyAccommodationsPage } from './MyAccommodationsPage';
import * as AuthContext from '../features/auth/context/AuthContext';
import * as useMyAccommodationsHook from '../features/housing/hooks/useMyAccommodations';
import * as useDeleteAccommodationHook from '../features/housing/hooks/useDeleteAccommodation';
import type { AccommodationResponse } from '../features/housing/types/accommodation.types';

vi.mock('../features/auth/context/AuthContext');
vi.mock('../features/housing/hooks/useMyAccommodations');
vi.mock('../features/housing/hooks/useDeleteAccommodation');

const mockAccommodation: AccommodationResponse = {
  id: 'acc-123',
  address: 'Calle Sierpes 45',
  city: 'Sevilla',
  province: 'Sevilla',
  country: 'España',
  latitude: 37.39,
  longitude: -5.99,
  totalRooms: 4,
  totalBathrooms: 2,
  freeRooms: 2,
  squareMeters: 110,
  amenities: ['ELEVATOR', 'WIFI'],
  images: [
    {
      id: 'img-1',
      imageUrl: 'https://res.cloudinary.com/demo/image1.jpg',
      displayOrder: 0,
    },
  ],
  ownerId: 'owner-1',
  ownerNickname: 'OwnerUser',
  deletedAt: null,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

describe('MyAccommodationsPage', () => {
  const mockRefetch = vi.fn();
  const mockDeleteAccommodation = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'owner-1', email: 'owner@test.com', role: 'HOST' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      token: 'fake-token',
    });

    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [mockAccommodation],
      totalElements: 1,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    vi.mocked(useDeleteAccommodationHook.useDeleteAccommodation).mockReturnValue({
      deleteAccommodation: mockDeleteAccommodation,
      isLoading: false,
      error: null,
      setError: mockSetError,
    });
  });

  it('renders loading state when fetching accommodations', () => {
    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [],
      totalElements: 0,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Mis alojamientos')).toBeInTheDocument();
    expect(screen.queryByText('Calle Sierpes 45')).not.toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [],
      totalElements: 0,
      isLoading: false,
      error: 'Error al cargar los alojamientos.',
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Error al cargar los alojamientos.')).toBeInTheDocument();
  });

  it('renders empty state when user has no accommodations', () => {
    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [],
      totalElements: 0,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Aún no tienes alojamientos')).toBeInTheDocument();
    expect(screen.getByText('Comenzar')).toBeInTheDocument();
  });

  it('renders accommodation cards with details and action buttons', () => {
    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Calle Sierpes 45')).toBeInTheDocument();
    expect(screen.getByText('Sevilla, Sevilla')).toBeInTheDocument();
    expect(screen.getByText('4 hab.')).toBeInTheDocument();
    expect(screen.getByText('110 m²')).toBeInTheDocument();
    expect(screen.getByTitle('Editar alojamiento')).toBeInTheDocument();
    expect(screen.getByTitle('Eliminar alojamiento')).toBeInTheDocument();
    expect(screen.getByText('Publicar')).toBeInTheDocument();
  });

  it('opens confirm delete modal when clicking the delete button', () => {
    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByTitle('Eliminar alojamiento');
    fireEvent.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Eliminar Alojamiento')).toBeInTheDocument();
    expect(within(dialog).getByText(/Calle Sierpes 45/)).toBeInTheDocument();
  });

  it('calls deleteAccommodation and triggers refetch and banner on confirmation', async () => {
    mockDeleteAccommodation.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar alojamiento'));

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar alojamiento' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteAccommodation).toHaveBeenCalledWith('acc-123');
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/El alojamiento "Calle Sierpes 45" ha sido eliminado del sistema./)
    ).toBeInTheDocument();
  });

  it('does not dismiss modal or refetch if deletion fails', async () => {
    mockDeleteAccommodation.mockResolvedValueOnce(false);

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar alojamiento'));

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar alojamiento' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteAccommodation).toHaveBeenCalledWith('acc-123');
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/ha sido eliminado del sistema/)).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders accommodation without images using placeholder icon', () => {
    const accWithoutImages: AccommodationResponse = {
      ...mockAccommodation,
      id: 'acc-no-img',
      images: [],
    };

    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [accWithoutImages],
      totalElements: 1,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Calle Sierpes 45')).toBeInTheDocument();
  });

  it('renders accommodation with multiple images sorted by displayOrder', () => {
    const accWithMultipleImages: AccommodationResponse = {
      ...mockAccommodation,
      id: 'acc-multi-img',
      images: [
        { id: 'img-2', imageUrl: 'https://res.cloudinary.com/demo/order2.jpg', displayOrder: 2 },
        { id: 'img-1', imageUrl: 'https://res.cloudinary.com/demo/order1.jpg', displayOrder: 1 },
      ],
    };

    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [accWithMultipleImages],
      totalElements: 1,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: 'Alojamiento' }) as HTMLImageElement;
    expect(img.src).toContain('order1.jpg');
  });

  it('closes modal when cancel button is clicked', () => {
    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar alojamiento'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close modal while isDeleting is true', () => {
    vi.mocked(useDeleteAccommodationHook.useDeleteAccommodation).mockReturnValue({
      deleteAccommodation: mockDeleteAccommodation,
      isLoading: true,
      error: null,
      setError: mockSetError,
    });

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar alojamiento'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(cancelBtn).toBeDisabled();
    fireEvent.click(cancelBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('automatically hides the success banner after timeout', async () => {
    vi.useFakeTimers();
    mockDeleteAccommodation.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyAccommodationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar alojamiento'));
    const confirmBtn = screen.getByRole('button', { name: 'Eliminar alojamiento' });
    
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(screen.getByText(/ha sido eliminado del sistema/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.queryByText(/ha sido eliminado del sistema/)).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});


