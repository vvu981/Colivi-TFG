import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StickyContextChatHeader } from './StickyContextChatHeader';
import type { ConversationSummary } from '../types';

describe('StickyContextChatHeader Component', () => {
  const baseConversation: ConversationSummary = {
    conversationId: 'conv-1',
    listingId: 'list-1',
    listingTitle: 'Habitación Luminosa Centro',
    listingPricePerMonth: 450,
    listingThumbnailUrl: 'https://example.com/thumb.jpg',
    interlocutorId: 'user-2',
    interlocutorName: 'Ana Propietaria',
    interlocutorProfilePic: null,
    activeBookingRequestId: 'book-1',
    bookingStatus: 'CONSULTATION',
    bookingStartDate: '2026-10-01',
    bookingEndDate: '2027-02-01',
    lastMessagePreview: 'Hola',
    lastMessageAt: '2026-09-07T12:00:00Z',
    unreadCount: 0,
    isArchived: false,
    isHost: false,
    isReported: false,
  };

  it('debe renderizar título, precio, fechas, interlocutor y badge de consulta', () => {
    render(
      <StickyContextChatHeader
        conversation={baseConversation}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(screen.getByText('Habitación Luminosa Centro')).toBeInTheDocument();
    expect(screen.getByText('450 €/mes')).toBeInTheDocument();
    expect(screen.getByText('Consulta Abierta')).toBeInTheDocument();
    expect(screen.getByText('Ana Propietaria')).toBeInTheDocument();
    expect(screen.getByText(/2026-10-01 al 2027-02-01/)).toBeInTheDocument();
    expect(screen.getByAltText('Habitación Luminosa Centro')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    );
  });

  it('muestra el botón "Solicitar Reserva" para el inquilino y responde al click', async () => {
    const user = userEvent.setup();
    const onRequestBooking = vi.fn();

    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isHost: false, bookingStatus: 'CONSULTATION' }}
        onRequestBooking={onRequestBooking}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    const ctaButton = screen.getByRole('button', { name: /solicitar reserva/i });
    expect(ctaButton).toBeInTheDocument();

    await user.click(ctaButton);
    expect(onRequestBooking).toHaveBeenCalledTimes(1);
  });

  it('no muestra el botón "Solicitar Reserva" cuando el usuario es el anfitrión', () => {
    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isHost: true }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /solicitar reserva/i })).not.toBeInTheDocument();
  });

  it('muestra el botón de archivar para el anfitrión y ejecuta callback', async () => {
    const user = userEvent.setup();
    const onArchiveToggle = vi.fn();

    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isHost: true, isArchived: false }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={onArchiveToggle}
        onReportUser={vi.fn()}
      />
    );

    const archiveBtn = screen.getByRole('button', { name: /archivar consulta/i });
    expect(archiveBtn).toBeInTheDocument();

    await user.click(archiveBtn);
    expect(onArchiveToggle).toHaveBeenCalledTimes(1);
  });

  it('muestra el botón de desarchivar para el anfitrión cuando ya está archivada', () => {
    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isHost: true, isArchived: true }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /desarchivar/i })).toBeInTheDocument();
  });

  it('muestra el botón "Denunciar" y responde al click cuando no está reportada', async () => {
    const user = userEvent.setup();
    const onReportUser = vi.fn();

    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isReported: false }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={onReportUser}
      />
    );

    const reportBtn = screen.getByRole('button', { name: /denunciar/i });
    expect(reportBtn).toBeInTheDocument();

    await user.click(reportBtn);
    expect(onReportUser).toHaveBeenCalledTimes(1);
  });

  it('muestra el badge "Denunciada" cuando isReported es true', () => {
    render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, isReported: true }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );

    expect(screen.getByText('Denunciada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /denunciar/i })).not.toBeInTheDocument();
  });

  it('renderiza correctamente los distintos badges de estado de reserva', () => {
    const { rerender } = render(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'PENDING' }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.getByText('Reserva Pendiente')).toBeInTheDocument();

    rerender(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'ACCEPTED' }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.getByText('Reserva Aceptada')).toBeInTheDocument();

    rerender(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'CONFIRMED' }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.getByText('Reserva Confirmada')).toBeInTheDocument();

    rerender(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'CANCELLED' }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.getByText('Reserva Cancelada')).toBeInTheDocument();

    rerender(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'EXPIRED' }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.getByText('Reserva Caducada')).toBeInTheDocument();

    rerender(
      <StickyContextChatHeader
        conversation={{ ...baseConversation, bookingStatus: 'UNKNOWN' as any }}
        onRequestBooking={vi.fn()}
        onArchiveToggle={vi.fn()}
        onReportUser={vi.fn()}
      />
    );
    expect(screen.queryByText('Reserva Caducada')).not.toBeInTheDocument();
  });
});
