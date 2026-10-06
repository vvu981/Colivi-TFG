import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout Component', () => {
  it('renderiza título, subtítulo y contenido hijo de forma accesible', () => {
    render(
      <MemoryRouter>
        <AuthLayout title="Iniciar sesión" subtitle="Introduce tus credenciales">
          <form data-testid="test-form">
            <input placeholder="Email" />
          </form>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText('Introduce tus credenciales')).toBeInTheDocument();
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Colivi/i })).toHaveAttribute('href', '/');
  });
});
