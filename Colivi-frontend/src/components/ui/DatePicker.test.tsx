import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('renders with placeholder when no value is provided', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Elige día" />);
    expect(screen.getByText('Elige día')).toBeInTheDocument();
  });

  it('renders formatted date when value is provided', () => {
    render(<DatePicker value="2026-09-15" onChange={vi.fn()} />);
    expect(screen.getByText('15 de Septiembre de 2026')).toBeInTheDocument();
  });

  it('opens calendar dropdown on click and allows selecting a day', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-09-15" onChange={onChange} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument();

    // Click on day 20
    const day20 = screen.getByRole('button', { name: '20 de Septiembre' });
    fireEvent.click(day20);

    expect(onChange).toHaveBeenCalledWith('2026-09-20');
  });

  it('navigates to next and previous month', () => {
    render(<DatePicker value="2026-09-15" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument();

    const nextBtn = screen.getByLabelText('Mes siguiente');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Octubre 2026')).toBeInTheDocument();

    const prevBtn = screen.getByLabelText('Mes anterior');
    fireEvent.click(prevBtn);

    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument();
  });
});
