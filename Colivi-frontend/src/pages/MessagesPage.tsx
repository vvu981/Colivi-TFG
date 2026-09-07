import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { useMessagingInbox } from '../features/messaging/hooks/useMessagingInbox';
import { useConversationChat } from '../features/messaging/hooks/useConversationChat';
import { InboxView } from '../features/messaging/components/InboxView';
import { StickyContextChatHeader } from '../features/messaging/components/StickyContextChatHeader';
import { ChatWindow } from '../features/messaging/components/ChatWindow';
import { ReportConversationModal } from '../features/report/components/ReportConversationModal';

export const MessagesPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const {
    conversations,
    isLoading: isInboxLoading,
    archiveConversation,
    isArchiving,
    isArchivedTab,
    setIsArchivedTab,
    refetch: refetchInbox,
  } = useMessagingInbox();

  const {
    conversation,
    messages,
    isLoading: isChatLoading,
    sendMessage,
    isSending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetchConversation,
  } = useConversationChat(conversationId);

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const handleBackToInbox = () => {
    navigate('/messages');
  };

  const handleRequestBooking = () => {
    if (conversation) {
      navigate(`/listings/${conversation.listingId}`);
    }
  };

  const handleReportUser = () => {
    setIsReportModalOpen(true);
  };

  const handleArchiveToggle = () => {
    if (conversation) {
      archiveConversation(conversation.conversationId, !conversation.isArchived);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6 flex-1 flex flex-col">
        {/* Contenedor Principal Estilo Tarjeta Elevada con Bordes Redondeados */}
        <div className="flex-1 bg-surface rounded-3xl border border-outline-variant/80 shadow-md flex overflow-hidden h-[calc(100vh-10.5rem)] min-h-[580px]">
          
          {/* ─── Panel Izquierdo: Bandeja de Entrada (Inbox) ─────────────────── */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-outline-variant/60 flex-shrink-0 bg-surface flex flex-col ${
              conversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <InboxView
              conversations={conversations}
              selectedConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onArchiveToggle={(id, currentArchived) =>
                archiveConversation(id, !currentArchived)
              }
              isLoading={isInboxLoading}
              isArchivedTab={isArchivedTab}
              onTabChange={setIsArchivedTab}
            />
          </div>

          {/* ─── Panel Derecho: Conversación Activa o Estado Vacío ───────────── */}
          <div
            className={`flex-1 flex flex-col bg-background overflow-hidden ${
              !conversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {conversationId ? (
              isChatLoading && !conversation ? (
                <div className="flex-1 flex items-center justify-center bg-surface-container-lowest/50">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <svg
                      className="w-8 h-8 animate-spin text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <p className="text-xs font-semibold">Cargando conversación...</p>
                  </div>
                </div>
              ) : conversation ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Barra Superior Móvil: Volver a Bandeja */}
                  <div className="md:hidden flex items-center gap-2 p-2.5 bg-surface border-b border-outline-variant/60">
                    <button
                      type="button"
                      onClick={handleBackToInbox}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                      </svg>
                      <span>Volver a mensajes</span>
                    </button>
                  </div>

                  <StickyContextChatHeader
                    conversation={conversation}
                    onRequestBooking={handleRequestBooking}
                    onArchiveToggle={handleArchiveToggle}
                    onReportUser={handleReportUser}
                    isArchiving={isArchiving}
                  />

                  <div className="flex-1 overflow-hidden">
                    <ChatWindow
                      conversation={conversation}
                      messages={messages}
                      onSendMessage={sendMessage}
                      onRequestBooking={handleRequestBooking}
                      isSending={isSending}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center bg-surface-container-lowest/50">
                  <div className="max-w-sm p-8 rounded-3xl bg-surface border border-outline-variant/60 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-on-surface">Conversación no disponible</h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 mb-5 leading-relaxed">
                      El hilo solicitado no existe o no dispones de los permisos necesarios para consultarlo.
                    </p>
                    <button
                      type="button"
                      onClick={handleBackToInbox}
                      className="w-full py-2.5 text-xs font-semibold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity shadow-xs"
                    >
                      Ir a la bandeja principal
                    </button>
                  </div>
                </div>
              )
            ) : (
              // ─── Hero de Bienvenida cuando no hay chat seleccionado en escritorio ─
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-surface-container-lowest/40">
                <div className="max-w-md p-8 sm:p-10 rounded-3xl bg-surface border border-outline-variant/60 shadow-sm">
                  {/* Icono Principal Dual-Tone */}
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-5 border border-primary/20 shadow-xs">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.69-3.091c-.55-.027-1.1-.06-1.649-.101a2.25 2.25 0 01-1.98-2.193v-4.286c0-.969.616-1.813 1.5-2.097a22.25 22.25 0 017.319 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 15.75H6a3.75 3.75 0 01-3.75-3.75V6A3.75 3.75 0 016 2.25h12A3.75 3.75 0 0121.75 6v1.5"
                      />
                    </svg>
                  </div>
                  
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">
                    Tus Conversaciones de Coliving
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                    Selecciona una conversación del panel izquierdo para consultar dudas con los anfitriones, negociar fechas y dar seguimiento al estado de tus solicitudes.
                  </p>

                  {/* Pills de Confianza y Seguridad */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6 pt-6 border-t border-outline-variant/40">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-[11px] font-medium text-on-surface-variant">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Contexto transaccional activo</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-[11px] font-medium text-on-surface-variant">
                      <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span>Canal seguro y protegido</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {conversation && (
        <ReportConversationModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          conversationId={conversation.conversationId}
          interlocutorName={conversation.interlocutorName}
          listingTitle={conversation.listingTitle}
          onSuccess={() => {
            refetchConversation?.();
            refetchInbox?.();
          }}
        />
      )}
    </MainLayout>
  );
};
