import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiAssistantWidget } from './AiAssistantWidget';

vi.mock('./AiChatWindow', () => ({
  AiChatWindow: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-chat-window">
      <span>Ventana del Copiloto</span>
      <button onClick={onClose}>Cerrar Mock</button>
    </div>
  ),
}));

import { MemoryRouter } from 'react-router-dom';

describe('AiAssistantWidget component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia en estado colapsado mostrando el botón flotante (FAB)', () => {
    render(
      <MemoryRouter>
        <AiAssistantWidget />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /abrir asistente colivi ia/i })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat-window')).not.toBeInTheDocument();
  });

  it('despliega el panel de chat al hacer clic en el FAB', async () => {
    render(
      <MemoryRouter>
        <AiAssistantWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole('button', { name: /abrir asistente colivi ia/i });
    await userEvent.click(fabButton);

    expect(screen.getByTestId('mock-chat-window')).toBeInTheDocument();
  });

  it('permite cerrar el panel pulsando la tecla Escape', async () => {
    render(
      <MemoryRouter>
        <AiAssistantWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole('button', { name: /abrir asistente colivi ia/i });
    await userEvent.click(fabButton);

    expect(screen.getByTestId('mock-chat-window')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByTestId('mock-chat-window')).not.toBeInTheDocument();
  });

  it('aplica clase bottom-36 en móvil cuando está en /listings/:id para evitar colisión', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/listings/abc-123']}>
        <AiAssistantWidget />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('bottom-36');
  });

  it('aplica clase bottom-20 en móvil cuando está en cualquier otra página', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <AiAssistantWidget />
      </MemoryRouter>
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('bottom-20');
  });
});
