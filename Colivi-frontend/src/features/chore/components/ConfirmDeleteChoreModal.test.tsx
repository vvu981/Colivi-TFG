import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteChoreModal } from './ConfirmDeleteChoreModal';
import type { ChoreResponseDto } from '../types';

describe('ConfirmDeleteChoreModal', () => {
  const recurringChore: ChoreResponseDto = {
    id: 'chore-1',
    seriesId: 'series-1',
    homeId: 'home-1',
    title: 'Fregar suelo',
    description: null,
    assigneeId: 'user-1',
    assigneeName: 'Ana García',
    assigneeAvatar: null,
    completedById: null,
    completedByName: null,
    completedByAvatar: null,
    basePoints: 10,
    dueDate: '2026-09-05',
    status: 'PENDING',
    completedAt: null,
    createdAt: '2026-09-01T10:00:00',
    isLate: false,
    canRescue: false,
    canComplete: true,
  };

  it('renders single and forward deletion options for recurring chores', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmDeleteChoreModal
        chore={recurringChore}
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Eliminar Tarea')).toBeInTheDocument();
    expect(screen.getByText(/pertenece a una serie recurrente/i)).toBeInTheDocument();
    expect(screen.getByText('Solo esta tarea')).toBeInTheDocument();
    expect(screen.getByText('Esta y todas las tareas futuras')).toBeInTheDocument();

    // Select DELETE_FORWARD
    fireEvent.click(screen.getByLabelText(/Esta y todas las tareas futuras/i));

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Eliminación/i });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith('chore-1', 'DELETE_FORWARD');
  });
});
