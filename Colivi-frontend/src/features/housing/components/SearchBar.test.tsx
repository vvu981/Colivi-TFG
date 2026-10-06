import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from './SearchBar';
import { listingService } from '../api/listingService';

vi.mock('../api/listingService', () => ({
  listingService: {
    search: vi.fn(),
  },
}));

vi.mock('../hooks/usePriceHistogram', () => ({
  usePriceHistogram: vi.fn(() => ({
    globalMaxPrice: 2000,
    globalHistogramData: [
      { price: 500, count: 5 },
      { price: 1000, count: 10 },
    ],
  })),
}));

describe('SearchBar Component', () => {
  const mockOnSearch = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listingService.search).mockResolvedValue({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    } as any);
  });

  it('renders all form input fields and search button', async () => {
    await act(async () => {
      render(<SearchBar onSearch={mockOnSearch} onReset={mockOnReset} />);
    });

    expect(screen.getByLabelText('Buscador de alojamientos')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Ático céntrico…')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Madrid, Sevilla…')).toBeInTheDocument();
    expect(screen.getByText('Cualquier tipo')).toBeInTheDocument();
    expect(screen.getByText('Cualquier precio')).toBeInTheDocument();
    expect(screen.getAllByText('Comodidades')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Buscar alojamientos' })).toBeInTheDocument();
  });

  it('does not display reset button when there are no active filters', async () => {
    await act(async () => {
      render(<SearchBar onSearch={mockOnSearch} onReset={mockOnReset} />);
    });

    expect(screen.queryByRole('button', { name: 'Restablecer filtros' })).not.toBeInTheDocument();
  });

  it('displays reset button when an active filter is entered', async () => {
    await act(async () => {
      render(<SearchBar onSearch={mockOnSearch} onReset={mockOnReset} />);
    });

    const titleInput = screen.getByPlaceholderText('Ej. Ático céntrico…');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Ático' } });
    });

    expect(screen.getByRole('button', { name: 'Restablecer filtros' })).toBeInTheDocument();
  });

  it('submits search parameters on form submit', async () => {
    await act(async () => {
      render(<SearchBar onSearch={mockOnSearch} onReset={mockOnReset} />);
    });

    const titleInput = screen.getByPlaceholderText('Ej. Ático céntrico…');
    const cityInput = screen.getByPlaceholderText('Madrid, Sevilla…');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Estudio' } });
      fireEvent.change(cityInput, { target: { value: 'Barcelona' } });
    });

    const submitBtn = screen.getByRole('button', { name: 'Buscar alojamientos' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockOnSearch).toHaveBeenCalledWith({
      title: 'Estudio',
      city: 'Barcelona',
      minPrice: undefined,
      maxPrice: undefined,
      rentalType: undefined,
      amenities: undefined,
    });
  });

  it('clears inputs and invokes onReset when reset button is clicked', async () => {
    await act(async () => {
      render(<SearchBar onSearch={mockOnSearch} onReset={mockOnReset} />);
    });

    const titleInput = screen.getByPlaceholderText('Ej. Ático céntrico…') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Chalet' } });
    });

    const resetBtn = screen.getByRole('button', { name: 'Restablecer filtros' });
    expect(resetBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(titleInput.value).toBe('');
    expect(mockOnReset).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Restablecer filtros' })).not.toBeInTheDocument();
    });
  });
});
