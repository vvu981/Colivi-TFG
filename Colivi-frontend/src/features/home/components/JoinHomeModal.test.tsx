import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinHomeModal } from './JoinHomeModal';

describe('JoinHomeModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <JoinHomeModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('transforma el código a mayúsculas y envía el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<JoinHomeModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByText('Unirse a un Hogar')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/ABC123XYZ/);
    fireEvent.change(input, { target: { value: 'codigo1234' } });

    expect(input).toHaveValue('CODIGO1234');

    const submitBtn = screen.getByRole('button', { name: /Unirme/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({ invitationCode: 'CODIGO1234' });
  });
});
