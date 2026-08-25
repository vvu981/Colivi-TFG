import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Edit3, Send, CheckCircle2, Lock, Sparkles, Mail } from 'lucide-react';
import type { AccommodationListingResponse } from '../../types/listing.types';

export interface ListingBookingCardProps {
  listing: AccommodationListingResponse;
  currentUserId?: string | null;
}

/**
 * Sticky pricing, booking and contact card.
 * Single Responsibility: Presenting financial details and handling user engagement CTAs.
 */
export const ListingBookingCard: React.FC<ListingBookingCardProps> = ({
  listing,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const { id, pricePerMonth, securityDeposit, hostId, hostNickname, accommodation } = listing;

  const isOwner = Boolean(
    (currentUserId && hostId && currentUserId === hostId) ||
    (currentUserId && accommodation?.ownerId && currentUserId === accommodation.ownerId)
  );

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(pricePerMonth);

  const formattedDeposit = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(securityDeposit);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setIsContactModalOpen(false);
      setContactMessage('');
    }, 2000);
  };

  return (
    <>
      <aside className="sticky top-24 w-full rounded-3xl bg-surface-container-lowest border border-outline-variant p-6 shadow-md flex flex-col gap-5">
        {/* Price Header */}
        <div className="flex items-baseline justify-between border-b border-outline-variant pb-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">/ mes</span>
            </div>
            <span className="text-xs text-on-surface-variant/80 mt-0.5 block">
              Fianza: {formattedDeposit}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <Sparkles size={12} />
            <span>Sin comisiones ocultas</span>
          </div>
        </div>

        {/* Breakdown preview */}
        <div className="flex flex-col gap-2 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60">
          <div className="flex justify-between">
            <span>Alquiler mensual</span>
            <span className="font-semibold text-on-surface">{formattedPrice}</span>
          </div>
          <div className="flex justify-between">
            <span>Depósito de fianza (reembolsable)</span>
            <span className="font-semibold text-on-surface">{formattedDeposit}</span>
          </div>
          <div className="flex justify-between border-t border-outline-variant/60 pt-2 font-bold text-on-surface">
            <span>Total primer mes</span>
            <span className="text-primary font-extrabold">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(pricePerMonth + securityDeposit)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {isOwner ? (
            <button
              type="button"
              onClick={() => navigate(`/edit-listing/${id}`)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <Edit3 size={18} />
              <span>Editar este anuncio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <Send size={18} />
              <span>Contactar con el anfitrión</span>
            </button>
          )}
        </div>

        {/* Guarantees */}
        <div className="flex flex-col gap-2 text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary flex-shrink-0" />
            <span>Verificación de anfitriones y perfiles</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-primary flex-shrink-0" />
            <span>Fianza custodiada y protegida</span>
          </div>
        </div>
      </aside>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Enviar mensaje</h3>
                  <p className="text-xs text-on-surface-variant">A {hostNickname || 'el anfitrión'}</p>
                </div>
              </div>
            </div>

            {messageSent ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center text-primary">
                <CheckCircle2 size={40} />
                <span className="text-base font-bold">¡Mensaje enviado con éxito!</span>
                <span className="text-xs text-on-surface-variant">El anfitrión se pondrá en contacto pronto.</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="contact-msg" className="text-xs font-semibold text-on-surface-variant">
                    Tu mensaje o consulta
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`Hola ${hostNickname || 'anfitrión'}, me interesa tu anuncio y me gustaría saber más sobre la disponibilidad...`}
                    className="w-full p-3 rounded-2xl border border-outline-variant bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send size={16} />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
