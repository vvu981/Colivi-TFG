import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from './ChatWindow';
import type { ConversationSummary, Message } from '../types';

describe('ChatWindow Component', () => {
  const mockConversation: ConversationSummary = {
    conversationId: 'c-1',
    listingId: 'l-1',
    listingTitle: 'Habitación Luminosa Centro',
    listingPricePerMonth: 450,
    interlocutorId: 'u-2',
    interlocutorName: 'Ana Propietaria',
    interlocutorProfilePic: null,
    activeBookingRequestId: null,
    bookingStatus: 'CONSULTATION',
    lastMessagePreview: 'Hola',
    lastMessageAt: '2026-09-07T12:00:00Z',
    unreadCount: 0,
    isArchived: false,
    isHost: false,
    isReported: false,
  };

  const userMessageMine: Message = {
    id: 'm-1',
    conversationId: 'c-1',
    senderId: 'my-user-id',
    senderName: 'Víctor',
    content: 'Hola, ¿está disponible el piso?',
    messageType: 'USER_MESSAGE',
    status: 'READ',
    createdAt: '2026-09-07T12:00:00Z',
    isMine: true,
  };

  const userMessageOther: Message = {
    id: 'm-2',
    conversationId: 'c-1',
    senderId: 'u-2',
    senderName: 'Ana Propietaria',
    content: 'Hola Víctor, sí, disponible para octubre.',
    messageType: 'USER_MESSAGE',
    status: 'SENT',
    createdAt: '2026-09-07T12:05:00Z',
    isMine: false,
  };

  const systemMessage: Message = {
    id: 'm-3',
    conversationId: 'c-1',
    senderId: null,
    senderName: 'Sistema',
    content: '¿Todo claro? Solicita la reserva ahora para asegurar tus fechas.',
    messageType: 'SYSTEM_MESSAGE',
    status: 'SENT',
    createdAt: '2026-09-07T12:10:00Z',
    isMine: false,
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('muestra el estado vacío cuando no hay mensajes', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText('Canal de Consulta Abierto')).toBeInTheDocument();
    expect(
      screen.getByText(/escribe tu primera pregunta para resolver dudas/i)
    ).toBeInTheDocument();
  });

  it('renderiza mensajes propios, del interlocutor y del sistema', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine, userMessageOther, systemMessage]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText('Hola, ¿está disponible el piso?')).toBeInTheDocument();
    expect(screen.getByText('Hola Víctor, sí, disponible para octubre.')).toBeInTheDocument();
    expect(screen.getByText('Ana Propietaria')).toBeInTheDocument();
    expect(
      screen.getByText('¿Todo claro? Solicita la reserva ahora para asegurar tus fechas.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar reserva ahora/i })).toBeInTheDocument();
  });

  it('permite enviar mensaje al rellenar el textarea y pulsar el botón enviar', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={onSendMessage}
        onRequestBooking={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/escribe un mensaje/i);
    const submitBtn = screen.getByRole('button', { name: /enviar mensaje/i });

    expect(submitBtn).toBeDisabled();

    await user.type(textarea, '¿Tiene calefacción?');
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);
    expect(onSendMessage).toHaveBeenCalledWith('¿Tiene calefacción?');
  });

  it('permite enviar mensaje al presionar Enter (sin shift)', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={onSendMessage}
        onRequestBooking={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/escribe un mensaje/i);
    await user.type(textarea, '¿Cuándo puedo visitarlo?{Enter}');

    expect(onSendMessage).toHaveBeenCalledWith('¿Cuándo puedo visitarlo?');
  });

  it('renderiza banner de modo solo lectura cuando isReadOnly es true', () => {
    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
        isReadOnly={true}
      />
    );

    expect(
      screen.getByText(/esta conversación está en modo solo lectura/i)
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/escribe un mensaje/i)).not.toBeInTheDocument();
  });

  it('renderiza botón de cargar más mensajes cuando hasNextPage es true', async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn();

    const { rerender } = render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
        hasNextPage={true}
        fetchNextPage={fetchNextPage}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /cargar mensajes anteriores/i });
    expect(loadMoreBtn).toBeInTheDocument();

    await user.click(loadMoreBtn);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    rerender(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
        hasNextPage={true}
        isFetchingNextPage={true}
      />
    );

    expect(screen.getByText(/cargando mensajes anteriores\.\.\./i)).toBeInTheDocument();
  });

  it('muestra estado de envío optimista "Enviando"', () => {
    const pendingMsg: Message = {
      ...userMessageMine,
      id: 'temp-1',
      isPending: true,
    };

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[pendingMsg]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText('Enviando')).toBeInTheDocument();
  });

  it('ejecuta onRequestBooking al pulsar el botón del aviso de sistema', async () => {
    const user = userEvent.setup();
    const onRequestBooking = vi.fn();

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[systemMessage]}
        onSendMessage={vi.fn()}
        onRequestBooking={onRequestBooking}
      />
    );

    const bookBtn = screen.getByRole('button', { name: /solicitar reserva ahora/i });
    await user.click(bookBtn);

    expect(onRequestBooking).toHaveBeenCalledTimes(1);
  });

  it('tolera fechas inválidas sin romper el renderizado', () => {
    const invalidDateMsg: Message = {
      ...userMessageMine,
      createdAt: 'fecha-invalida',
    };

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[invalidDateMsg]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText(invalidDateMsg.content)).toBeInTheDocument();
  });

  it('renderiza check individual cuando el mensaje propio está en estado SENT', () => {
    const sentMsg: Message = {
      ...userMessageMine,
      id: 'm-sent',
      status: 'SENT',
    };

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[sentMsg]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText(sentMsg.content)).toBeInTheDocument();
  });

  it('controla el scroll y muestra el botón flotante para bajar al fondo', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine, userMessageOther]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLDivElement;
    expect(scrollContainer).toBeInTheDocument();

    // Simulamos que el scroll sube lejos del fondo
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true, writable: true });

    // Disparamos scroll dentro de act
    act(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    const scrollBottomBtn = await screen.findByRole('button', { name: /bajar a los mensajes recientes/i });
    expect(scrollBottomBtn).toBeInTheDocument();

    await user.click(scrollBottomBtn);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('soporta mensajes con fechas atípicas sin lanzar error', () => {
    const invalidDateMessage: Message = {
      ...userMessageMine,
      id: 'msg-inv',
      createdAt: 'invalid-date',
    };

    render(
      <ChatWindow
        conversation={mockConversation}
        messages={[invalidDateMessage]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
      />
    );

    expect(screen.getByText('Hola, ¿está disponible el piso?')).toBeInTheDocument();
  });

  it('dispara fetchNextPage al hacer scroll arriba y compensa la altura al cargar', () => {
    const mockFetchNext = vi.fn();
    const { container, rerender } = render(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageMine]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={mockFetchNext}
      />
    );

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 800, configurable: true, writable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 10, configurable: true, writable: true });

    act(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    expect(mockFetchNext).toHaveBeenCalled();

    // Rerender con nuevos mensajes prepended
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1200, configurable: true, writable: true });
    rerender(
      <ChatWindow
        conversation={mockConversation}
        messages={[userMessageOther, userMessageMine]}
        onSendMessage={vi.fn()}
        onRequestBooking={vi.fn()}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={mockFetchNext}
      />
    );

    expect(scrollContainer.scrollTop).toBeGreaterThanOrEqual(10);
  });
});
