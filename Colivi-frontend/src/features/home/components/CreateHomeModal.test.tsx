import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateHomeModal } from './CreateHomeModal';

describe('CreateHomeModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <CreateHomeModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('valida que el nombre no esté vacío y envía el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<CreateHomeModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByText('Crear un Nuevo Hogar')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Piso Calle Mayor/);
    fireEvent.change(input, { target: { value: 'Mi Piso' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Hogar/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Mi Piso' });
  });
});
