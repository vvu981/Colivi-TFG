import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeActivityFeed } from './HomeActivityFeed';
import { useHomeActivities } from '../hooks/useHomeActivities';

vi.mock('../hooks/useHomeActivities');

describe('HomeActivityFeed', () => {
  it('muestra estado vacío si no hay actividades', () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      activities: [],
      pageData: null,
      currentPage: 0,
      isLoading: false,
      error: null,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    render(<HomeActivityFeed homeId="h1" />);
    expect(screen.getByText('No hay actividad registrada')).toBeInTheDocument();
  });

  it('renderiza la lista de eventos de actividad', () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      activities: [
        {
          id: 'a1',
          homeId: 'h1',
          actorFullName: 'Víctor Vallejo',
          activityType: 'HOME_CREATED',
          description: 'El hogar ha sido creado.',
          createdAt: '2026-01-01T12:00:00Z',
        },
      ],
      pageData: {
        content: [],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: false,
      },
      currentPage: 0,
      isLoading: false,
      error: null,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    render(<HomeActivityFeed homeId="h1" />);
    expect(screen.getByText('El hogar ha sido creado.')).toBeInTheDocument();
    expect(screen.getByText('Víctor Vallejo')).toBeInTheDocument();
  });
});
