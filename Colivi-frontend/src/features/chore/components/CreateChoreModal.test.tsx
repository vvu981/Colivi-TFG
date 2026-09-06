import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateChoreModal } from './CreateChoreModal';
import type { HomeMemberResponseDto } from '../../home/types';

describe('CreateChoreModal', () => {
  const mockMembers: HomeMemberResponseDto[] = [
    {
      userId: 'user-1',
      fullName: 'Ana García',
      email: 'ana@test.com',
      profilePicUrl: null,
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
    {
      userId: 'user-2',
      fullName: 'Borja Martín',
      email: 'borja@test.com',
      profilePicUrl: null,
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    },
  ];

  it('renders form and submits single chore successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <CreateChoreModal
        isOpen={true}
        onClose={onClose}
        members={mockMembers}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Nueva Tarea Doméstica')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Fregar platos/i);
    fireEvent.change(titleInput, { target: { value: 'Limpiar nevera' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Tarea/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Limpiar nevera',
          assigneeId: 'user-1',
          basePoints: 10,
          recurrence: 'NONE',
          occurrences: 1,
        })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('allows configuring recurrence with finite occurrences', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <CreateChoreModal
        isOpen={true}
        onClose={onClose}
        members={mockMembers}
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Fregar platos/i);
    fireEvent.change(titleInput, { target: { value: 'Sacar basura diaria' } });

    // Select DAILY recurrence
    const recurrenceBtn = screen.getByRole('button', { name: /Repetir tarea automáticamente/i });
    fireEvent.click(recurrenceBtn);
    const dailyOption = screen.getByRole('option', { name: /Diariamente/i });
    fireEvent.click(dailyOption);

    // Occurrences input should appear
    const occurrencesInput = screen.getByDisplayValue('7');
    fireEvent.change(occurrencesInput, { target: { value: '14' } });

    // Select +20 pts
    const ptsBtn = screen.getByRole('button', { name: '+20 pts' });
    fireEvent.click(ptsBtn);

    const submitBtn = screen.getByRole('button', { name: /Crear Tarea/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sacar basura diaria',
          recurrence: 'DAILY',
          occurrences: 14,
          basePoints: 20,
        })
      );
    });
  });

  it('allows manual entry of custom reward points', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <CreateChoreModal
        isOpen={true}
        onClose={onClose}
        members={mockMembers}
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Fregar platos/i);
    fireEvent.change(titleInput, { target: { value: 'Pintar pared' } });

    // Manually enter 85 points
    const pointsInput = screen.getByLabelText(/Puntos de recompensa/i);
    fireEvent.change(pointsInput, { target: { value: '85' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Tarea/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pintar pared',
          basePoints: 85,
        })
      );
    });
  });

  it('allows configuring custom recurrence with specific days of the week (e.g. Lunes, Martes, Jueves)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <CreateChoreModal
        isOpen={true}
        onClose={onClose}
        members={mockMembers}
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Fregar platos/i);
    fireEvent.change(titleInput, { target: { value: 'Limpieza cocina' } });

    // Select CUSTOM recurrence
    const recurrenceBtn = screen.getByRole('button', { name: /Repetir tarea automáticamente/i });
    fireEvent.click(recurrenceBtn);
    const customOption = screen.getByRole('option', { name: /Días específicos de la semana/i });
    fireEvent.click(customOption);

    // Days selector should appear with default [1, 2, 4] (L, M, J)
    // Let's toggle Viernes (5) on
    const viernesBtn = screen.getByRole('button', { name: /^Viernes$/i });
    fireEvent.click(viernesBtn);

    const submitBtn = screen.getByRole('button', { name: /Crear Tarea/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Limpieza cocina',
          recurrence: 'CUSTOM',
          customDaysOfWeek: [1, 2, 4, 5],
        })
      );
    });
  });
});


