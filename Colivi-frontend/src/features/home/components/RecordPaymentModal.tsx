import React, { useState, useEffect, useId, useMemo } from 'react';
import { X, Loader2, ArrowRightLeft, AlertCircle, Coins, FileText } from 'lucide-react';
import { Select, type SelectOption } from '../../../components/ui/Select';
import type { HomeMemberResponseDto, RecordPaymentRequest } from '../types';
import { getUserInitial } from '../utils/userDisplay';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMembers: HomeMemberResponseDto[];
  currentUserId?: string;
  initialPayerId?: string;
  initialReceiverId?: string;
  initialAmount?: number;
  onRecordPayment: (data: RecordPaymentRequest) => Promise<unknown>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  activeMembers,
  currentUserId,
  initialPayerId,
  initialReceiverId,
  initialAmount,
  onRecordPayment,
}) => {
  const modalTitleId = useId();
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar campos cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    const defaultPayer = initialPayerId || (activeMembers.some((m) => m.userId === currentUserId) ? currentUserId : activeMembers[0]?.userId) || '';
    setPayerId(defaultPayer);

    const availableReceivers = activeMembers.filter((m) => m.userId !== defaultPayer);
    const defaultReceiver = initialReceiverId && initialReceiverId !== defaultPayer
      ? initialReceiverId
      : availableReceivers[0]?.userId || '';
    setReceiverId(defaultReceiver);

    setAmountStr(initialAmount && initialAmount > 0 ? initialAmount.toFixed(2) : '');
    setNotes('');
    setError(null);
  }, [isOpen, initialPayerId, initialReceiverId, initialAmount, activeMembers, currentUserId]);

  // Si cambia el pagador y coincide con el receptor, buscar un nuevo receptor
  const handlePayerChange = (newPayerId: string) => {
    setPayerId(newPayerId);
    if (newPayerId === receiverId) {
      const nextReceiver = activeMembers.find((m) => m.userId !== newPayerId);
      setReceiverId(nextReceiver?.userId || '');
    }
  };

  // Opciones de selección con avatar o inicial
  const payerOptions: SelectOption[] = useMemo(() => {
    return activeMembers.map((m) => {
      const initial = getUserInitial(m.fullName);
      return {
        value: m.userId,
        label: `${m.fullName}${m.userId === currentUserId ? ' (Tú)' : ''}`,
        icon: m.profilePicUrl ? (
          <img
            src={m.profilePicUrl}
            alt={m.fullName}
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            {initial}
          </span>
        ),
      };
    });
  }, [activeMembers, currentUserId]);

  const receiverOptions: SelectOption[] = useMemo(() => {
    return activeMembers
      .filter((m) => m.userId !== payerId)
      .map((m) => {
        const initial = getUserInitial(m.fullName);
        return {
          value: m.userId,
          label: `${m.fullName}${m.userId === currentUserId ? ' (Tú)' : ''}`,
          icon: m.profilePicUrl ? (
            <img
              src={m.profilePicUrl}
              alt={m.fullName}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {initial}
            </span>
          ),
        };
      });
  }, [activeMembers, payerId, currentUserId]);

  // Manejar teclado (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setError('El importe del pago debe ser un número mayor que 0.00 €');
      return;
    }

    if (!payerId) {
      setError('Debes seleccionar quién realiza el pago.');
      return;
    }

    if (!receiverId) {
      setError('Debes seleccionar quién recibe el pago.');
      return;
    }

    if (payerId === receiverId) {
      setError('El pagador y el receptor no pueden ser la misma persona.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordPayment({
        payerId,
        receiverId,
        amount: Math.round(amount * 100) / 100,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 max-w-md w-full p-6 sm:p-7 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 id={modalTitleId} className="text-base sm:text-lg font-bold text-on-surface">
              Registrar Pago entre Convivientes
            </h2>
            <p className="text-xs text-secondary">
              Registra una transferencia directa (Bizum, efectivo) para saldar deudas.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-error/10 text-error text-xs border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quién Pagó */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              ¿Quién pagó el dinero?
            </label>
            <Select
              value={payerId}
              onChange={handlePayerChange}
              options={payerOptions}
              disabled={isSubmitting}
              className="w-full text-xs"
            />
          </div>

          {/* Quién Recibió */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              ¿Quién recibió el dinero?
            </label>
            <Select
              value={receiverId}
              onChange={setReceiverId}
              options={receiverOptions}
              disabled={isSubmitting || receiverOptions.length === 0}
              placeholder="Selecciona el receptor..."
              className="w-full text-xs"
            />
          </div>

          {/* Importe */}
          <div>
            <label htmlFor="payment-amount" className="block text-xs font-bold text-on-surface mb-1.5">
              Importe Pagado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                <Coins className="w-4 h-4" />
              </div>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-secondary">
                €
              </div>
            </div>
          </div>

          {/* Notas o Concepto Opcional */}
          <div>
            <label htmlFor="payment-notes" className="block text-xs font-bold text-on-surface mb-1.5">
              Concepto / Notas (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                <FileText className="w-4 h-4" />
              </div>
              <input
                id="payment-notes"
                type="text"
                maxLength={255}
                placeholder="Ej. Bizum cena viernes, efectivo fianza..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Registrar Pago</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
