import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MessagesPage } from './MessagesPage';
import { useMessagingInbox } from '../features/messaging/hooks/useMessagingInbox';
import { useConversationChat } from '../features/messaging/hooks/useConversationChat';
import type { ConversationSummary, Message } from '../features/messaging/types';

vi.mock('../features/messaging/hooks/useMessagingInbox');
vi.mock('../features/messaging/hooks/useConversationChat');

// Mock de MainLayout para aislar la prueba
vi.mock('../layouts/MainLayout', () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// Mock de ReportConversationModal
vi.mock('../features/report/components/ReportConversationModal', () => ({
  ReportConversationModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="report-modal">
        <span>Modal de Denuncia</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

describe('MessagesPage Integration Tests', () => {
  const mockConversation: ConversationSummary = {
    conversationId: 'c-1',
    listingId: 'l-1',
    listingTitle: 'Piso Gran Vía',
    listingPricePerMonth: 550,
    interlocutorId: 'u-2',
    interlocutorName: 'Laura',
    interlocutorProfilePic: null,
    activeBookingRequestId: null,
    bookingStatus: 'CONSULTATION',
    lastMessagePreview: 'Hola, ¿sigue libre?',
    lastMessageAt: '2026-09-07T12:00:00Z',
    unreadCount: 0,
    isArchived: false,
    isHost: false,
    isReported: false,
  };

  const mockMessage: Message = {
    id: 'm-1',
    conversationId: 'c-1',
    senderId: 'my-id',
    senderName: 'Víctor',
    content: 'Hola Laura',
    messageType: 'USER_MESSAGE',
    status: 'SENT',
    createdAt: '2026-09-07T12:00:00Z',
    isMine: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    vi.mocked(useMessagingInbox).mockReturnValue({
      conversations: [mockConversation],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      setPage: vi.fn(),
      isArchivedTab: false,
      setIsArchivedTab: vi.fn(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      archiveConversation: vi.fn(),
      isArchiving: false,
      startConsultation: vi.fn(),
      isStartingConsultation: false,
    });

    vi.mocked(useConversationChat).mockReturnValue({
      conversation: mockConversation,
      messages: [mockMessage],
      isLoading: false,
      isError: false,
      error: null,
      sendMessage: vi.fn(),
      isSending: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });
  });

  it('renderiza la lista de conversaciones y el estado vacío cuando no hay conversación seleccionada', () => {
    vi.mocked(useConversationChat).mockReturnValue({
      conversation: undefined,
      messages: [],
      isLoading: false,
      isError: false,
      error: null,
      sendMessage: vi.fn(),
      isSending: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Routes>
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Mensajes')).toBeInTheDocument();
    expect(screen.getByText('Piso Gran Vía')).toBeInTheDocument();
    expect(screen.getByText(/selecciona una conversación/i)).toBeInTheDocument();
  });

  it('renderiza la conversación activa cuando hay un ID en la URL', () => {
    render(
      <MemoryRouter initialEntries={['/messages/c-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Laura')[0]).toBeInTheDocument();
    expect(screen.getByText('Hola Laura')).toBeInTheDocument();
    expect(screen.getByText('Consulta Abierta')).toBeInTheDocument();
  });

  it('abre el modal de denuncia al pulsar denunciar', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/messages/c-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    );

    const reportBtn = screen.getByRole('button', { name: /denunciar/i });
    await user.click(reportBtn);

    expect(screen.getByTestId('report-modal')).toBeInTheDocument();
  });

  it('navega al anuncio al pulsar Solicitar Reserva desde la cabecera', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/messages/c-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/listings/:listingId" element={<div>Detalle de Anuncio</div>} />
        </Routes>
      </MemoryRouter>
    );

    const bookingBtn = screen.getByRole('button', { name: /solicitar reserva/i });
    await user.click(bookingBtn);

    expect(screen.getByText('Detalle de Anuncio')).toBeInTheDocument();
  });

  it('ejecuta archiveConversation al alternar archivo como anfitrión', async () => {
    const user = userEvent.setup();
    const mockArchive = vi.fn();

    vi.mocked(useMessagingInbox).mockReturnValue({
      conversations: [{ ...mockConversation, isHost: true }],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      setPage: vi.fn(),
      isArchivedTab: false,
      setIsArchivedTab: vi.fn(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      archiveConversation: mockArchive,
      isArchiving: false,
      startConsultation: vi.fn(),
      isStartingConsultation: false,
    });

    vi.mocked(useConversationChat).mockReturnValue({
      conversation: { ...mockConversation, isHost: true },
      messages: [mockMessage],
      isLoading: false,
      isError: false,
      error: null,
      sendMessage: vi.fn(),
      isSending: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(
      <MemoryRouter initialEntries={['/messages/c-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    );

    const archiveBtn = screen.getByRole('button', { name: /archivar consulta/i });
    await user.click(archiveBtn);

    expect(mockArchive).toHaveBeenCalledWith('c-1', true);
  });
});
