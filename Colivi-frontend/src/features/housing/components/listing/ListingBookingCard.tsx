import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Edit3, Send, CheckCircle2, Lock, Sparkles, CalendarDays, Loader2 } from 'lucide-react';
import type { AccommodationListingResponse } from '../../types/listing.types';
import { bookingRequestService } from '../../api/bookingRequestService';
import type { BookingRequestPayload } from '../../types/booking.types';
import { MonthPicker } from '../../../../components/ui/MonthPicker';
import { Select } from '../../../../components/ui/Select';

/** Formats a Date to yyyy-mm-dd without UTC timezone drift. */
function toISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const DURATION_OPTIONS = [
  { value: '1',  label: '1 mes' },
  { value: '3',  label: '3 meses' },
  { value: '6',  label: '6 meses' },
  { value: '9',  label: '9 meses' },
  { value: '12', label: '12 meses' },
];

/**
 * Returns the last day (yyyy-mm-dd) of the month that results from adding
 * `months` to the given start date's month. This matches the backend contract:
 * reservations must end on the last day of the target month.
 *
 * Examples:
 *   startDate: 2026-09-01 + 3 months  → 2026-11-30
 *   startDate: 2026-12-01 + 2 months  → 2027-01-31  (year boundary)
 *   startDate: 2027-01-01 + 1 month   → 2027-02-28  (leap-year aware)
 */
function lastDayOfResultingMonth(isoStartDate: string, months: number): string {
  const [y, m] = isoStartDate.split('-').map(Number);
  const totalMonths  = (y * 12 + (m - 1)) + months - 1;
  const targetYear   = Math.floor(totalMonths / 12);
  const targetMonth  = totalMonths % 12; // 0-indexed
  // day = 0 of the NEXT month = last day of targetMonth
  const lastDay      = new Date(targetYear, targetMonth + 1, 0);
  return toISODate(lastDay);
}

/** Returns a yyyy-mm-dd for the 1st of the current month (lower bound for the DatePicker). */
function firstDayOfCurrentMonth(): string {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

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
  
  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    setIsSubmitting(true);
    setError(null);

    const endDateStr = lastDayOfResultingMonth(startDate, durationMonths);

    try {
      const payload: BookingRequestPayload = {
        accommodationListingId: id,
        startDate,
        endDate: endDateStr,
        message: contactMessage.trim() ? contactMessage : undefined
      };
      
      await bookingRequestService.createBookingRequest(payload);
      
      setMessageSent(true);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // First day of current month — the backend rejects past months
  const minDate = firstDayOfCurrentMonth();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (messageSent) {
      timeoutId = setTimeout(() => {
        setMessageSent(false);
        setIsContactModalOpen(false);
        setContactMessage('');
        setStartDate('');
        setDurationMonths(6);
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, [messageSent]);

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
               <CalendarDays size={18} />
               <span>Solicitar reserva</span>
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

      {/* Booking Modal via React Portal */}
      {isContactModalOpen && document.body && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-surface-dim/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsContactModalOpen(false)}
        >
          <div
            className="w-[min(28rem,calc(100vw-2rem))] bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Solicitud de Reserva</h3>
                  <p className="text-xs text-on-surface-variant">Se enviará a {hostNickname || 'el anfitrión'}</p>
                </div>
              </div>
            </div>

            {messageSent ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center text-primary">
                <CheckCircle2 size={40} />
                <span className="text-base font-bold">¡Solicitud enviada con éxito!</span>
                <span className="text-xs text-on-surface-variant">El anfitrión revisará tu solicitud de reserva pronto.</span>
              </div>
            ) : (
              <form onSubmit={handleBookingRequest} className="flex flex-col gap-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="start-date" className="text-xs font-semibold text-on-surface-variant">
                      Mes de entrada
                    </label>
                    <MonthPicker
                      id="start-date"
                      value={startDate}
                      onChange={setStartDate}
                      min={minDate}
                      placeholder="Selecciona mes"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="duration-months" className="text-xs font-semibold text-on-surface-variant">
                      Duración estimada
                    </label>
                    <Select
                      id="duration-months"
                      value={String(durationMonths)}
                      onChange={(v) => setDurationMonths(Number(v))}
                      options={DURATION_OPTIONS}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="contact-msg" className="text-xs font-semibold text-on-surface-variant">
                    Mensaje de presentación (opcional)
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={3}
                    maxLength={1000}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`Hola ${hostNickname || 'anfitrión'}, me encantaría alojarme aquí...`}
                    className="w-full p-3 rounded-2xl border border-outline-variant bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
                
                {error && (
                  <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsContactModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !startDate}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>{isSubmitting ? 'Enviando...' : 'Solicitar'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      , document.body)}
    </>
  );
};

