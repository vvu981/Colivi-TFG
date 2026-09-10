import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChatWindow } from './AiChatWindow';
import * as useAiChatModule from '../hooks/useAiChat';

vi.mock('../hooks/useAiChat');

describe('AiChatWindow component', () => {
  const mockSendMessage = vi.fn();
  const mockClearHistory = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    vi.spyOn(useAiChatModule, 'useAiChat').mockReturnValue({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Bienvenido al copiloto.',
          timestamp: '2026-09-09T10:00:00Z',
        },
      ],
      sendMessage: mockSendMessage,
      isPending: false,
      error: null,
      clearHistory: mockClearHistory,
      suggestions: [
        {
          id: 's-1',
          label: 'Ver mis tareas',
          prompt: '¿Cuáles son mis tareas del hogar?',
        },
      ],
      isAuthenticated: true,
    });
  });

  it('renderiza la cabecera y el mensaje de bienvenida', () => {
    render(<AiChatWindow onClose={mockOnClose} />);

    expect(screen.getByText('Copiloto Colivi IA')).toBeInTheDocument();
    expect(screen.getByText('Conectado a MCP (Solo lectura)')).toBeInTheDocument();
    expect(screen.getByText('Bienvenido al copiloto.')).toBeInTheDocument();
  });

  it('permite enviar un mensaje mediante el formulario', async () => {
    render(<AiChatWindow onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Pregunta sobre habitaciones/i);
    await userEvent.type(input, 'Buscar habitaciones');

    const submitBtn = screen.getByRole('button', { name: /enviar mensaje/i });
    await userEvent.click(submitBtn);

    expect(mockSendMessage).toHaveBeenCalledWith('Buscar habitaciones');
  });

  it('permite enviar una sugerencia rápida pulsando un chip', async () => {
    render(<AiChatWindow onClose={mockOnClose} />);

    const chip = screen.getByRole('button', { name: 'Ver mis tareas' });
    await userEvent.click(chip);

    expect(mockSendMessage).toHaveBeenCalledWith('¿Cuáles son mis tareas del hogar?');
  });

  it('muestra el indicador de carga cuando isPending es true', () => {
    vi.spyOn(useAiChatModule, 'useAiChat').mockReturnValue({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Bienvenido.',
          timestamp: '2026-09-09T10:00:00Z',
        },
      ],
      sendMessage: mockSendMessage,
      isPending: true,
      error: null,
      clearHistory: mockClearHistory,
      suggestions: [],
      isAuthenticated: true,
    });

    render(<AiChatWindow onClose={mockOnClose} />);

    expect(
      screen.getByText(/El asistente está consultando las herramientas.../i)
    ).toBeInTheDocument();
  });

  it('muestra aviso de inicio de sesión cuando el usuario no está autenticado (UX-01)', () => {
    vi.spyOn(useAiChatModule, 'useAiChat').mockReturnValue({
      messages: [
        {
          id: 'greeting-msg',
          role: 'assistant',
          content: 'Hola. Soy el Asistente Inteligente.',
          timestamp: '2026-09-09T10:00:00Z',
        },
      ],
      sendMessage: mockSendMessage,
      isPending: false,
      error: null,
      clearHistory: mockClearHistory,
      suggestions: [],
      isAuthenticated: false,
    });

    render(<AiChatWindow onClose={mockOnClose} />);

    expect(
      screen.getByText(/Inicia sesión en Colivi para interactuar con el Asistente IA/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Pregunta sobre habitaciones/i)).not.toBeInTheDocument();
  });
});
