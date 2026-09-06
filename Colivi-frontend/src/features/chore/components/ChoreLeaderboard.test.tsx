import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChoreLeaderboard } from './ChoreLeaderboard';
import type { ChoreLeaderboardDto } from '../types';

describe('ChoreLeaderboard', () => {
  const mockLeaderboard: ChoreLeaderboardDto = {
    period: 'WEEKLY',
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    scores: [
      {
        userId: 'user-1',
        nickname: 'ana',
        fullName: 'Ana García',
        profilePicUrl: null,
        currentPoints: 25,
        expectedPoints: 40,
        completedCount: 2,
        rescuedCount: 1,
        penalizedCount: 0,
        pendingCount: 1,
      },
      {
        userId: 'user-2',
        nickname: 'borja',
        fullName: 'Borja Martín',
        profilePicUrl: null,
        currentPoints: -10,
        expectedPoints: 10,
        completedCount: 0,
        rescuedCount: 0,
        penalizedCount: 1,
        pendingCount: 2,
      },
    ],
  };

  it('renders scores, medals, rescue badges and expected points', () => {
    const onPeriodChange = vi.fn();

    render(
      <MemoryRouter>
        <ChoreLeaderboard
          leaderboard={mockLeaderboard}
          period="WEEKLY"
          onPeriodChange={onPeriodChange}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Tabla de Convivencia')).toBeInTheDocument();
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument(); // expected points Ana
    expect(screen.getByText(/1 rescate/i)).toBeInTheDocument();

    expect(screen.getByText('Borja Martín')).toBeInTheDocument();
    expect(screen.getByText('-10 pts')).toBeInTheDocument();
    expect(screen.getByText(/1 atraso/i)).toBeInTheDocument();

    // Verify profile links for both users
    const anaLinks = screen.getAllByRole('link', { name: /Ana García/i });
    expect(anaLinks.length).toBeGreaterThanOrEqual(1);
    expect(anaLinks[0]).toHaveAttribute('href', '/users/user-1');

    const borjaLinks = screen.getAllByRole('link', { name: /Borja Martín/i });
    expect(borjaLinks.length).toBeGreaterThanOrEqual(1);
    expect(borjaLinks[0]).toHaveAttribute('href', '/users/user-2');

    const monthlyBtn = screen.getByRole('button', { name: /mensual/i });
    fireEvent.click(monthlyBtn);
    expect(onPeriodChange).toHaveBeenCalledWith('MONTHLY');
  });
});
