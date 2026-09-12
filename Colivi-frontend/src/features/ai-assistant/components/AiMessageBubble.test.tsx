import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiMessageBubble } from './AiMessageBubble';
import type { AiChatMessage } from '../types';

describe('AiMessageBubble component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renderiza un mensaje del usuario correctamente alineado', () => {
    const userMsg: AiChatMessage = {
      id: '1',
      role: 'user',
      content: 'Mensaje de prueba del usuario',
      timestamp: '2026-09-09T10:00:00Z',
    };

    render(<AiMessageBubble message={userMsg} />);

    expect(screen.getByText('Mensaje de prueba del usuario')).toBeInTheDocument();
  });

  it('renderiza markdown enriquecido para las respuestas del asistente', () => {
    const assistantMsg: AiChatMessage = {
      id: '2',
      role: 'assistant',
      content: '**Texto en negrita** y una lista:\n- Elemento uno\n- Elemento dos',
      timestamp: '2026-09-09T10:01:00Z',
    };

    render(<AiMessageBubble message={assistantMsg} />);

    expect(screen.getByText('Texto en negrita')).toBeInTheDocument();
    expect(screen.getByText('Elemento uno')).toBeInTheDocument();
    expect(screen.getByText('Elemento dos')).toBeInTheDocument();
  });

  it('muestra la sección de borrador con botón de copiado funcional', async () => {
    const draftMsg: AiChatMessage = {
      id: '3',
      role: 'assistant',
      content: 'He preparado un borrador para tu candidato:',
      draftContent: 'Hola Juan, acepto tu solicitud para la habitación.',
      timestamp: '2026-09-09T10:02:00Z',
    };

    render(<AiMessageBubble message={draftMsg} />);

    expect(screen.getByText('Borrador sugerido para enviar')).toBeInTheDocument();
    expect(screen.getByText('Hola Juan, acepto tu solicitud para la habitación.')).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /copiar texto al portapapeles/i });
    await userEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Hola Juan, acepto tu solicitud para la habitación.'
    );
    expect(screen.getByText('Copiado')).toBeInTheDocument();
  });
});
