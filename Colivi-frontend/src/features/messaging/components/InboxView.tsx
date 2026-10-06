import React, { useState } from 'react';
import type { ConversationSummary } from '../types';

interface InboxViewProps {
  conversations: ConversationSummary[];
  selectedConversationId?: string | null;
  onSelectConversation: (conversationId: string) => void;
  onArchiveToggle?: (conversationId: string, currentArchived: boolean) => void;
  isLoading?: boolean;
  isArchivedTab?: boolean;
  onTabChange?: (isArchived: boolean) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalElements?: number;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onArchiveToggle,
  isLoading = false,
  isArchivedTab: controlledIsArchived,
  onTabChange,
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
}) => {
  const [internalTab, setInternalTab] = useState<'active' | 'archived'>('active');
  const isControlled = controlledIsArchived !== undefined;
  const activeTab = isControlled ? (controlledIsArchived ? 'archived' : 'active') : internalTab;

  const handleTabClick = (tab: 'active' | 'archived') => {
    if (onTabChange) {
      onTabChange(tab === 'archived');
    } else {
      setInternalTab(tab);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations
    .filter((c) => (isControlled ? true : (activeTab === 'archived' ? c.isArchived : !c.isArchived)))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.interlocutorName.toLowerCase().includes(q) ||
        c.listingTitle.toLowerCase().includes(q) ||
        (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q))
      );
    });

  const activeCount = isControlled
    ? (activeTab === 'active' ? (totalElements !== undefined ? totalElements : conversations.length) : 0)
    : conversations.filter((c) => !c.isArchived).length;
  const archivedCount = isControlled
    ? (activeTab === 'archived' ? (totalElements !== undefined ? totalElements : conversations.length) : 0)
    : conversations.filter((c) => c.isArchived).length;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `${diffMin}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: ConversationSummary['bookingStatus']) => {
    switch (status) {
      case 'CONSULTATION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/60 rounded-md">
            Consulta
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-md">
            Pendiente
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-secondary-container text-on-secondary-container rounded-md">
            Aceptada
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container rounded-md">
            Confirmada
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-error/10 text-error rounded-md">
            Cerrada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-low/40 select-none">
      {/* ─── Encabezado del Inbox ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/60 bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-on-surface tracking-tight">Mensajes</h1>
              <p className="text-[11px] text-on-surface-variant">Consultas y reservas activas</p>
            </div>
          </div>
          {activeCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-surface-container-high text-on-surface border border-outline-variant/60">
              {activeCount} {activeCount === 1 ? 'chat' : 'chats'}
            </span>
          )}
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative mb-3">
          <svg
            className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuario o alojamiento..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-high/60 border border-outline-variant/60 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Pestañas Segmentadas Modernas */}
        <div className="bg-surface-container-high/80 p-1 rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => handleTabClick('active')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            }`}
          >
            <span>Activos</span>
            {activeCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'active' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {activeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('archived')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'archived'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            }`}
          >
            <span>Archivados</span>
            {archivedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'archived' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {archivedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Listado de Hilos ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
        {isLoading && conversations.length === 0 ? (
          // Skeletons de Carga Inicial Elegantes (Cero texto parpadeante)
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-surface border border-outline-variant/40 animate-pulse flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="flex justify-between">
                    <div className="h-3.5 bg-surface-container rounded-md w-24" />
                    <div className="h-3 bg-surface-container rounded-md w-10" />
                  </div>
                  <div className="h-3 bg-surface-container/70 rounded-md w-36" />
                  <div className="h-2.5 bg-surface-container/50 rounded-md w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          // Estado Vacío Agradable
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant mb-3 border border-outline-variant/60">
              <svg className="w-7 h-7 text-on-surface-variant/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-on-surface">
              {searchQuery ? 'Sin resultados' : activeTab === 'archived' ? 'Sin chats archivados' : 'Bandeja vacía'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-[200px] leading-relaxed">
              {searchQuery
                ? 'No encontramos conversaciones que coincidan con la búsqueda.'
                : activeTab === 'archived'
                ? 'Las conversaciones que archives aparecerán en esta sección.'
                : 'Inicia una consulta desde cualquier anuncio para comenzar a chatear.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversationId === conv.conversationId;
            const hasUnread = conv.unreadCount > 0;
            const initial = conv.interlocutorName ? conv.interlocutorName.charAt(0).toUpperCase() : 'U';

            return (
              <div
                key={conv.conversationId}
                onClick={() => onSelectConversation(conv.conversationId)}
                className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 border-l-3 ${
                  isSelected
                    ? 'bg-surface border-primary shadow-xs'
                    : hasUnread
                    ? 'bg-primary/5 hover:bg-surface border-primary/60'
                    : 'bg-surface hover:bg-surface-container-high/60 border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.interlocutorProfilePic ? (
                    <img
                      src={conv.interlocutorProfilePic}
                      alt={conv.interlocutorName}
                      className="w-11 h-11 rounded-2xl object-cover border border-outline-variant/60"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                      {initial}
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-surface" />
                  )}
                </div>

                {/* Contenido Central */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold truncate ${hasUnread ? 'text-primary' : 'text-on-surface'}`}>
                      {conv.interlocutorName}
                    </span>
                    <span className="text-[10px] text-on-surface-variant shrink-0 font-medium">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  {/* Título de Anuncio */}
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mb-1">
                    <svg className="w-3 h-3 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span className="truncate">{conv.listingTitle}</span>
                  </div>

                  {/* Vista Previa del Último Mensaje */}
                  <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-on-surface' : 'text-on-surface-variant/80'}`}>
                    {conv.lastMessagePreview || 'Conversación iniciada'}
                  </p>

                  {/* Estado y Badges */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    {getStatusBadge(conv.bookingStatus)}
                    
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                        {conv.unreadCount}
                      </span>
                    )}

                    {/* Botón de Archivar (disponible en hover) */}
                    {onArchiveToggle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveToggle(conv.conversationId, conv.isArchived);
                        }}
                        title={conv.isArchived ? 'Desarchivar' : 'Archivar'}
                        className="text-[10px] text-on-surface-variant hover:text-on-surface hover:underline opacity-60 hover:opacity-100"
                      >
                        {conv.isArchived ? 'Desarchivar' : 'Archivar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Paginación de Conversaciones ───────────────────────────────── */}
      {totalPages !== undefined && totalPages > 1 && (
        <div className="p-3 border-t border-outline-variant/60 bg-surface flex items-center justify-between text-xs text-on-surface-variant">
          <button
            type="button"
            disabled={(currentPage ?? 0) <= 0}
            onClick={() => onPageChange?.(Math.max(0, (currentPage ?? 0) - 1))}
            className="px-2.5 py-1 rounded-lg border border-outline-variant/60 disabled:opacity-40 hover:bg-surface-container transition-all"
          >
            Anterior
          </button>
          <span className="text-[11px] font-medium">
            Página {(currentPage ?? 0) + 1} de {totalPages}
          </span>
          <button
            type="button"
            disabled={(currentPage ?? 0) + 1 >= totalPages}
            onClick={() => onPageChange?.((currentPage ?? 0) + 1)}
            className="px-2.5 py-1 rounded-lg border border-outline-variant/60 disabled:opacity-40 hover:bg-surface-container transition-all"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};
