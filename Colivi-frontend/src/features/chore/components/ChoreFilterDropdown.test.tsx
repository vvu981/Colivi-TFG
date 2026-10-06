import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoreFilterDropdown, type ChoreFilters } from './ChoreFilterDropdown';

describe('ChoreFilterDropdown', () => {
  const defaultFilters: ChoreFilters = {
    status: 'ALL',
    date: 'ALL',
    customStartDate: '',
    customEndDate: '',
  };

  it('renders trigger button and toggles dropdown on click', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <ChoreFilterDropdown
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    const triggerBtn = screen.getByRole('button', { name: /Abrir filtros acumulables/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.queryByText('Filtros Acumulables')).not.toBeInTheDocument();

    fireEvent.click(triggerBtn);
    expect(screen.getByText('Filtros Acumulables')).toBeInTheDocument();
    expect(screen.getByText('Estado de la tarea')).toBeInTheDocument();
    expect(screen.getByText('Fecha de vencimiento')).toBeInTheDocument();
  });

  it('allows selecting status and displays custom date pickers when CUSTOM is selected', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(
      <ChoreFilterDropdown
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Abrir filtros acumulables/i }));

    // Click "No completadas"
    const pendingBtn = screen.getByRole('button', { name: /^No completadas/i });
    fireEvent.click(pendingBtn);
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' })
    );

    // Select "Entre fechas (X y Z)"
    const customDateBtn = screen.getByRole('button', { name: /Entre fechas \(X y Z\)/i });
    fireEvent.click(customDateBtn);
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ date: 'CUSTOM' })
    );

    // Rerender with date: 'CUSTOM' to see date pickers
    rerender(
      <ChoreFilterDropdown
        filters={{ ...defaultFilters, date: 'CUSTOM' }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    expect(screen.getByText('Desde (Fecha X)')).toBeInTheDocument();
    expect(screen.getByText('Hasta (Fecha Z)')).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <ChoreFilterDropdown
        filters={{ status: 'PENDING', date: 'WEEK' }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Abrir filtros acumulables/i }));

    const resetBtn = screen.getByRole('button', { name: /Restablecer/i });
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalled();
  });
});
