import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

describe('Select Component', () => {
  const options = [
    { value: 'opt1', label: 'Opción 1' },
    { value: 'opt2', label: 'Opción 2' },
    { value: 'opt3', label: 'Opción 3' },
  ];

  it('renders trigger button with placeholder or selected option', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Selecciona algo"
      />
    );
    expect(screen.getByRole('button', { name: /Selecciona algo/i })).toBeInTheDocument();
  });

  it('opens options list when clicked and selects an option', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="opt1"
        onChange={onChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const opt2 = screen.getByRole('option', { name: /Opción 2/i });
    fireEvent.click(opt2);

    expect(onChange).toHaveBeenCalledWith('opt2');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders dropdown upwards when direction="up"', () => {
    render(
      <Select
        value="opt1"
        onChange={vi.fn()}
        options={options}
        direction="up"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const listbox = screen.getByRole('listbox');
    expect(listbox.className).toContain('bottom-full');
  });
});
