import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminErrorBoundary } from './AdminErrorBoundary';

// Component that throws an error conditionally
const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Explosion in Admin Tab');
  }
  return <div>Tab operational</div>;
};

describe('AdminErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AdminErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </AdminErrorBoundary>
    );

    expect(screen.getByText('Tab operational')).toBeInTheDocument();
  });

  it('catches render errors, displays fallback UI and allows retry', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let hasThrown = true;

    const DynamicChild = () => {
      if (hasThrown) {
        throw new Error('Explosion in Admin Tab');
      }
      return <div>Tab operational</div>;
    };

    const onResetMock = vi.fn(() => {
      hasThrown = false;
    });

    render(
      <AdminErrorBoundary fallbackTitle="Error en tab de denuncias" onReset={onResetMock}>
        <DynamicChild />
      </AdminErrorBoundary>
    );

    expect(screen.getByText('Error en tab de denuncias')).toBeInTheDocument();
    expect(screen.getByText('Explosion in Admin Tab')).toBeInTheDocument();
    expect(screen.queryByText('Tab operational')).not.toBeInTheDocument();

    // Click retry button - onReset sets hasThrown to false and ErrorBoundary resets state
    const retryButton = screen.getByRole('button', { name: /reintentar carga/i });
    fireEvent.click(retryButton);

    expect(onResetMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tab operational')).toBeInTheDocument();
    expect(screen.queryByText('Error en tab de denuncias')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
