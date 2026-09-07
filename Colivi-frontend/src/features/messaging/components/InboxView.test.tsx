import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InboxView } from './InboxView';
import type { ConversationSummary } from '../types';

describe('InboxView Component', () => {
  const activeConversation: ConversationSummary = {
    conversationId: 'c-1',
    listingId: 'l-1',
    listingTitle: 'Estudio Sol',
    listingPricePerMonth: 500,
    interlocutorId: 'u-1',
    interlocutorName: 'Beatriz',
    interlocutorProfilePic: null,
    activeBookingRequestId: null,
    bookingStatus: 'CONSULTATION',
    lastMessagePreview: '¿Aceptas contrato de 6 meses?',
    lastMessageAt: '2026-09-07T12:00:00Z',
    unreadCount: 2,
    isArchived: false,
    isHost: true,
    isReported: false,
  };

  const archivedConversation: ConversationSummary = {
    conversationId: 'c-2',
    listingId: 'l-2',
    listingTitle: 'Habitación Gran Vía',
    listingPricePerMonth: 600,
    interlocutorId: 'u-2',
    interlocutorName: 'Carlos',
    interlocutorProfilePic: null,
    activeBookingRequestId: 'b-2',
    bookingStatus: 'CONFIRMED',
    lastMessagePreview: 'Todo listo para la llegada',
    lastMessageAt: '2026-09-01T10:00:00Z',
    unreadCount: 0,
    isArchived: true,
    isHost: true,
    isReported: false,
  };

  it('renderiza la cabecera con el título y las conversaciones activas', () => {
    render(
      <InboxView
        conversations={[activeConversation, archivedConversation]}
        onSelectConversation={vi.fn()}
      />
    );

    expect(screen.getByText('Mensajes')).toBeInTheDocument();
    expect(screen.getByText('Estudio Sol')).toBeInTheDocument();
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
    expect(screen.getByText('¿Aceptas contrato de 6 meses?')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread badge
    expect(screen.getByText('Consulta')).toBeInTheDocument();
  });

  it('permite alternar a la pestaña de Archivados y muestra sus conversaciones', async () => {
    const user = userEvent.setup();

    render(
      <InboxView
        conversations={[activeConversation, archivedConversation]}
        onSelectConversation={vi.fn()}
      />
    );

    const archivedTab = screen.getByRole('button', { name: /archivados/i });
    await user.click(archivedTab);

    expect(screen.getByText('Habitación Gran Vía')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.queryByText('Estudio Sol')).not.toBeInTheDocument();
  });

  it('filtra conversaciones al buscar por texto', async () => {
    const user = userEvent.setup();

    render(
      <InboxView
        conversations={[activeConversation, archivedConversation]}
        onSelectConversation={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por usuario o alojamiento/i);
    await user.type(searchInput, 'Inexistente');

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'Beatriz');
    expect(screen.getByText('Estudio Sol')).toBeInTheDocument();
  });

  it('selecciona una conversación al hacer click sobre la tarjeta', async () => {
    const user = userEvent.setup();
    const onSelectConversation = vi.fn();

    render(
      <InboxView
        conversations={[activeConversation]}
        onSelectConversation={onSelectConversation}
      />
    );

    const card = screen.getByText('Estudio Sol');
    await user.click(card);

    expect(onSelectConversation).toHaveBeenCalledWith('c-1');
  });

  it('ejecuta onArchiveToggle cuando el anfitrión hace click en el botón de archivar', async () => {
    const user = userEvent.setup();
    const onArchiveToggle = vi.fn();

    render(
      <InboxView
        conversations={[activeConversation]}
        onSelectConversation={vi.fn()}
        onArchiveToggle={onArchiveToggle}
      />
    );

    const archiveBtn = screen.getByRole('button', { name: 'Archivar' });
    await user.click(archiveBtn);

    expect(onArchiveToggle).toHaveBeenCalledWith('c-1', false);
  });

  it('renderiza badges de estado Pendiente, Aceptada y Cerrada', () => {
    const pendingConv: ConversationSummary = {
      ...activeConversation,
      conversationId: 'c-pend',
      bookingStatus: 'PENDING',
    };
    const acceptedConv: ConversationSummary = {
      ...activeConversation,
      conversationId: 'c-acc',
      bookingStatus: 'ACCEPTED',
    };
    const closedConv: ConversationSummary = {
      ...activeConversation,
      conversationId: 'c-clos',
      bookingStatus: 'CANCELLED',
    };

    render(
      <InboxView
        conversations={[pendingConv, acceptedConv, closedConv]}
        onSelectConversation={vi.fn()}
      />
    );

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Aceptada')).toBeInTheDocument();
    expect(screen.getByText('Cerrada')).toBeInTheDocument();
  });

  it('permite cambiar a archivados y volver a activos', async () => {
    const user = userEvent.setup();
    render(
      <InboxView
        conversations={[activeConversation]}
        onSelectConversation={vi.fn()}
      />
    );

    const archivedTab = screen.getByRole('button', { name: /archivados/i });
    await user.click(archivedTab);
    expect(screen.getByText(/sin chats archivados/i)).toBeInTheDocument();

    const activeTab = screen.getByRole('button', { name: /activos/i });
    await user.click(activeTab);
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
  });

  it('muestra skeletons de carga cuando isLoading es true y no hay conversaciones', () => {
    const { container } = render(
      <InboxView
        conversations={[]}
        isLoading={true}
        onSelectConversation={vi.fn()}
      />
    );

    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('formatea fechas antiguas mayores a 7 días y maneja fechas inválidas', () => {
    const oldConv: ConversationSummary = {
      ...activeConversation,
      conversationId: 'c-old',
      lastMessageAt: '2020-01-01T10:00:00Z',
      interlocutorProfilePic: 'https://example.com/avatar.jpg',
      bookingStatus: 'UNKNOWN' as any,
    };
    const invalidDateConv: ConversationSummary = {
      ...activeConversation,
      conversationId: 'c-inv',
      lastMessageAt: 'fecha-invalida',
    };

    render(
      <InboxView
        conversations={[oldConv, invalidDateConv]}
        onSelectConversation={vi.fn()}
      />
    );

    expect(screen.getByRole('img', { name: 'Beatriz' })).toBeInTheDocument();
  });

  it('llama a onTabChange al hacer click en las pestañas en modo controlado', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <InboxView
        conversations={[activeConversation]}
        onSelectConversation={vi.fn()}
        isArchivedTab={false}
        onTabChange={onTabChange}
      />
    );

    const archivedTab = screen.getByRole('button', { name: /archivados/i });
    await user.click(archivedTab);

    expect(onTabChange).toHaveBeenCalledWith(true);
  });
});
