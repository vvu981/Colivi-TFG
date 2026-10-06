import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
  Loader2,
  PlusCircle,
  Percent,
  Coins,
  Scale,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Select, type SelectOption } from '../../../components/ui/Select';
import type {
  HomeMemberResponseDto,
  CreateExpenseRequest,
  ExpenseSplitMode,
  ExpenseParticipantShareDto,
} from '../types';
import {
  calculateEqualSplit,
  convertPercentagesToAmounts,
  convertAmountsToPercentages,
  validatePercentageSplit,
  validateExactSplit,
  toCents,
  fromCents,
} from '../utils/expenseSplitter';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMembers: HomeMemberResponseDto[];
  currentUserId?: string;
  onCreateExpense: (data: CreateExpenseRequest) => Promise<unknown>;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  activeMembers,
  currentUserId,
  onCreateExpense,
}) => {
  const modalTitleId = useId();
  const [description, setDescription] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>('EQUAL');

  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar pagador y participantes al abrir
  useEffect(() => {
    if (!isOpen) return;

    setDescription('');
    setTotalAmountStr('');
    setError(null);
    setIsSubmitting(false);
    setSplitMode('EQUAL');

    const defaultPayer =
      activeMembers.find((m) => m.userId === currentUserId)?.userId ||
      activeMembers[0]?.userId ||
      '';
    setPayerId(defaultPayer);

    const allIds = activeMembers.map((m) => m.userId);
    setSelectedParticipantIds(allIds);

    // Inicializar porcentajes equitativos
    const initialPercentages: Record<string, number> = {};
    const count = allIds.length;
    if (count > 0) {
      const base = Math.floor(10000 / count) / 100;
      allIds.forEach((id, idx) => {
        initialPercentages[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
      });
    }
    setCustomPercentages(initialPercentages);
    setCustomAmounts({});
  }, [isOpen, activeMembers, currentUserId]);

  // Manejo de tecla Escape
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

  const payerOptions: SelectOption[] = useMemo(() => {
    return activeMembers.map((m) => ({
      value: m.userId,
      label: `${m.fullName}${m.userId === currentUserId ? ' (Tú)' : ''}`,
      icon: m.profilePicUrl ? (
        <img
          src={m.profilePicUrl}
          alt={m.fullName}
          className="w-5 h-5 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
          {m.fullName.charAt(0).toUpperCase()}
        </div>
      ),
    }));
  }, [activeMembers, currentUserId]);

  if (!isOpen) return null;

  const totalAmount = parseFloat(totalAmountStr) || 0;

  // Manejo de alternancia de participantes
  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) => {
      const isSelected = prev.includes(userId);
      let newSelected: string[];
      if (isSelected) {
        if (prev.length === 1) return prev; // mínimo 1 participante
        newSelected = prev.filter((id) => id !== userId);
      } else {
        newSelected = [...prev, userId];
      }

      // Reajustar porcentajes si estamos en modo porcentaje
      if (newSelected.length > 0) {
        const count = newSelected.length;
        const base = Math.floor(10000 / count) / 100;
        const nextPct: Record<string, number> = {};
        newSelected.forEach((id, idx) => {
          nextPct[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
        });
        setCustomPercentages(nextPct);
      }

      return newSelected;
    });
  };

  const handleSelectAllParticipants = () => {
    const allIds = activeMembers.map((m) => m.userId);
    setSelectedParticipantIds(allIds);
    const count = allIds.length;
    if (count > 0) {
      const base = Math.floor(10000 / count) / 100;
      const nextPct: Record<string, number> = {};
      allIds.forEach((id, idx) => {
        nextPct[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
      });
      setCustomPercentages(nextPct);
    }
  };

  // Cambio de modo de reparto con trasvase de datos
  const handleSplitModeChange = (newMode: ExpenseSplitMode) => {
    if (newMode === splitMode) return;

    if (newMode === 'PERCENTAGE') {
      if (splitMode === 'EXACT' && totalAmount > 0) {
        setCustomPercentages(convertAmountsToPercentages(totalAmount, customAmounts, selectedParticipantIds));
      } else {
        // Por defecto equitativo en porcentajes
        const count = selectedParticipantIds.length;
        if (count > 0) {
          const base = Math.floor(10000 / count) / 100;
          const nextPct: Record<string, number> = {};
          selectedParticipantIds.forEach((id, idx) => {
            nextPct[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
          });
          setCustomPercentages(nextPct);
        }
      }
    } else if (newMode === 'EXACT') {
      if (splitMode === 'PERCENTAGE' && totalAmount > 0) {
        setCustomAmounts(convertPercentagesToAmounts(totalAmount, customPercentages, selectedParticipantIds));
      } else if (totalAmount > 0) {
        setCustomAmounts(calculateEqualSplit(totalAmount, selectedParticipantIds));
      }
    }

    setSplitMode(newMode);
    setError(null);
  };

  // Actualización de porcentaje individual
  const handlePercentageChange = (userId: string, val: string) => {
    const num = parseFloat(val);
    const safeVal = isNaN(num) ? 0 : Math.max(0, num);
    setCustomPercentages((prev) => ({
      ...prev,
      [userId]: safeVal,
    }));
  };

  // Actualización de importe individual
  const handleAmountChange = (userId: string, val: string) => {
    const num = parseFloat(val);
    const safeVal = isNaN(num) ? 0 : Math.max(0, num);
    setCustomAmounts((prev) => ({
      ...prev,
      [userId]: safeVal,
    }));
  };

  // Validaciones reactivas
  const percentageValidation = validatePercentageSplit(customPercentages, selectedParticipantIds);
  const exactValidation = validateExactSplit(totalAmount, customAmounts, selectedParticipantIds);
  const equalSplit = calculateEqualSplit(totalAmount, selectedParticipantIds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('La descripción del gasto no puede estar vacía');
      return;
    }

    if (totalAmount <= 0) {
      setError('El importe total debe ser mayor que 0');
      return;
    }

    if (!payerId) {
      setError('Debes seleccionar a un pagador');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setError('Debe haber al menos un participante en el gasto');
      return;
    }

    let payloadCustomSplits: ExpenseParticipantShareDto[] | undefined = undefined;

    if (splitMode === 'PERCENTAGE') {
      if (!percentageValidation.isValid) {
        setError(percentageValidation.error || 'La suma de los porcentajes debe ser exactamente el 100%');
        return;
      }

      // Convertir porcentajes a importes en céntimos asegurando suma exacta
      const totalCents = toCents(totalAmount);
      let allocatedCents = 0;
      payloadCustomSplits = selectedParticipantIds.map((id, index) => {
        const pct = customPercentages[id] || 0;
        let cents = Math.round((pct / 100) * totalCents);

        // Si es el último participante, absorber cualquier posible céntimo de redondeo
        if (index === selectedParticipantIds.length - 1) {
          cents = totalCents - allocatedCents;
        } else {
          allocatedCents += cents;
        }

        return {
          userId: id,
          amount: fromCents(cents),
        };
      });
    } else if (splitMode === 'EXACT') {
      if (!exactValidation.isValid) {
        setError(
          exactValidation.error ||
            `La suma de las partes debe ser exactamente igual al total (${totalAmount.toFixed(2)} €)`
        );
        return;
      }

      payloadCustomSplits = selectedParticipantIds.map((id) => ({
        userId: id,
        amount: customAmounts[id] || 0,
      }));
    }

    setIsSubmitting(true);
    try {
      await onCreateExpense({
        description: description.trim(),
        totalAmount,
        payerId,
        participantIds: selectedParticipantIds,
        customSplits: payloadCustomSplits,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el gasto';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
    >
      <div className="relative w-full max-w-xl bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Botón de Cierre */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-secondary hover:text-on-surface disabled:opacity-40 transition-colors p-1"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 id={modalTitleId} className="text-lg font-bold text-on-surface">
              Añadir Nuevo Gasto
            </h2>
            <p className="text-xs text-secondary">
              Registra un desembolso y define cómo se distribuye entre los convivientes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Concepto e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="expense-description" className="text-xs font-semibold text-on-surface">
                Concepto del Gasto <span className="text-error">*</span>
              </label>
              <input
                id="expense-description"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Compra semanal Mercadona, Factura Wifi..."
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary/50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="expense-total-amount" className="text-xs font-semibold text-on-surface">
                Total (€) <span className="text-error">*</span>
              </label>
              <input
                id="expense-total-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Fila 2: Pagador */}
          <div className="space-y-1">
            <label htmlFor="expense-payer" className="text-xs font-semibold text-on-surface">
              ¿Quién pagó el gasto? <span className="text-error">*</span>
            </label>
            <Select
              id="expense-payer"
              aria-label="¿Quién pagó el gasto?"
              value={payerId}
              onChange={(val) => setPayerId(val)}
              options={payerOptions}
              disabled={isSubmitting}
              className="py-2.5 text-xs bg-surface"
            />
          </div>

          {/* Fila 3: Selección de Participantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Participantes afectados ({selectedParticipantIds.length}/{activeMembers.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllParticipants}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Seleccionar todos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {activeMembers.map((member) => {
                const isChecked = selectedParticipantIds.includes(member.userId);
                return (
                  <label
                    key={member.userId}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-primary/5 border-primary/40 text-on-surface'
                        : 'bg-surface border-outline-variant/40 text-secondary opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleParticipant(member.userId)}
                      disabled={isSubmitting}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium truncate">
                      {member.fullName} {member.userId === currentUserId ? '(Tú)' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selector de Modo de Reparto */}
          <div className="space-y-2 pt-1 border-t border-outline-variant/40">
            <label className="text-xs font-semibold text-on-surface">Modo de Reparto</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSplitModeChange('EQUAL')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  splitMode === 'EQUAL'
                    ? 'bg-primary text-white border-primary shadow-2xs'
                    : 'bg-surface border-outline-variant/60 text-secondary hover:text-on-surface'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Equitativo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSplitModeChange('PERCENTAGE')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  splitMode === 'PERCENTAGE'
                    ? 'bg-primary text-white border-primary shadow-2xs'
                    : 'bg-surface border-outline-variant/60 text-secondary hover:text-on-surface'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Porcentaje</span>
              </button>

              <button
                type="button"
                onClick={() => handleSplitModeChange('EXACT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  splitMode === 'EXACT'
                    ? 'bg-primary text-white border-primary shadow-2xs'
                    : 'bg-surface border-outline-variant/60 text-secondary hover:text-on-surface'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Importe Exacto</span>
              </button>
            </div>
          </div>

          {/* Sección de Reparto Granular según modo */}
          <div className="bg-surface/60 border border-outline-variant/50 rounded-2xl p-4 space-y-3">
            {/* Modo EQUITATIVO */}
            {splitMode === 'EQUAL' && (
              <div>
                <p className="text-xs text-secondary mb-2">
                  El importe total se dividirá a partes iguales entre los {selectedParticipantIds.length}{' '}
                  participantes seleccionados:
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedParticipantIds.map((id) => {
                    const m = activeMembers.find((member) => member.userId === id);
                    const amount = equalSplit[id] || 0;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between py-1 px-2 text-xs text-on-surface border-b border-outline-variant/20 last:border-b-0"
                      >
                        <span className="truncate">{m?.fullName}</span>
                        <span className="font-bold">{amount.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modo PORCENTAJE */}
            {splitMode === 'PERCENTAGE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Asignar porcentaje por participante:</span>
                  <span
                    className={`font-bold ${
                      percentageValidation.sum > 100
                        ? 'text-error'
                        : percentageValidation.isValid
                        ? 'text-emerald-700'
                        : 'text-amber-600'
                    }`}
                  >
                    Asignado: {percentageValidation.sum}% / 100%
                  </span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto p-1">
                  {selectedParticipantIds.map((id) => {
                    const m = activeMembers.find((member) => member.userId === id);
                    const pct = customPercentages[id] ?? 0;
                    const calculatedAmt = totalAmount > 0 ? ((pct / 100) * totalAmount).toFixed(2) : '0.00';

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 p-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl"
                      >
                        <span className="text-xs font-semibold text-on-surface truncate flex-1">
                          {m?.fullName}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-secondary">{calculatedAmt} €</span>
                          <div className="relative w-24">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={customPercentages[id] === 0 ? '' : (customPercentages[id] ?? '')}
                              placeholder="0"
                              onChange={(e) => handlePercentageChange(id, e.target.value)}
                              disabled={isSubmitting}
                              className="w-full pr-6 pl-2.5 py-1 bg-surface border border-outline-variant/60 rounded-lg text-xs font-bold text-right text-on-surface focus:outline-hidden focus:border-primary"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-bold pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {percentageValidation.sum > 100 && (
                  <div className="flex items-center gap-2 p-2 bg-error-container/20 border border-error/20 rounded-xl text-error text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>La suma de porcentajes no puede superar el 100%.</span>
                  </div>
                )}
                {percentageValidation.isValid && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 text-[11px]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Reparto del 100% completado correctamente.</span>
                  </div>
                )}
              </div>
            )}

            {/* Modo IMPORTE EXACTO */}
            {splitMode === 'EXACT' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Asignar cantidad fija (€) por participante:</span>
                  <span
                    className={`font-bold ${
                      exactValidation.sum > totalAmount
                        ? 'text-error'
                        : exactValidation.isValid
                        ? 'text-emerald-700'
                        : 'text-amber-600'
                    }`}
                  >
                    Asignado: {exactValidation.sum.toFixed(2)} € / {totalAmount.toFixed(2)} €
                  </span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto p-1">
                  {selectedParticipantIds.map((id) => {
                    const m = activeMembers.find((member) => member.userId === id);
                    const amt = customAmounts[id] ?? 0;
                    const calculatedPct = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(1) : '0.0';

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 p-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl"
                      >
                        <span className="text-xs font-semibold text-on-surface truncate flex-1">
                          {m?.fullName}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-secondary">{calculatedPct} %</span>
                          <div className="relative w-28">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalAmount}
                              value={customAmounts[id] === 0 ? '' : (customAmounts[id] ?? '')}
                              placeholder="0.00"
                              onChange={(e) => handleAmountChange(id, e.target.value)}
                              disabled={isSubmitting}
                              className="w-full pr-6 pl-2.5 py-1 bg-surface border border-outline-variant/60 rounded-lg text-xs font-bold text-right text-on-surface focus:outline-hidden focus:border-primary"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-bold pointer-events-none">
                              €
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {exactValidation.sum > totalAmount && (
                  <div className="flex items-center gap-2 p-2 bg-error-container/20 border border-error/20 rounded-xl text-error text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>La correspondencia no puede superar el gasto completo ({totalAmount.toFixed(2)} €).</span>
                  </div>
                )}
                {exactValidation.isValid && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 text-[11px]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Importe total cubierto exactamente.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-error-container/20 border border-error/20 rounded-xl text-xs text-error">
              {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (splitMode === 'PERCENTAGE' && !percentageValidation.isValid) ||
                (splitMode === 'EXACT' && !exactValidation.isValid) ||
                totalAmount <= 0
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
