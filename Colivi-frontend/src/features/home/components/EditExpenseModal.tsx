import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
  Loader2,
  Pencil,
  Percent,
  Coins,
  Scale,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Select, type SelectOption } from '../../../components/ui/Select';
import type {
  HomeMemberResponseDto,
  ExpenseResponseDto,
  UpdateExpenseRequest,
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

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseResponseDto | null;
  activeMembers: HomeMemberResponseDto[];
  currentUserId?: string;
  onUpdateExpense: (expenseId: string, data: UpdateExpenseRequest) => Promise<unknown>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  activeMembers,
  currentUserId,
  onUpdateExpense,
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

  const totalAmount = useMemo(() => {
    const val = parseFloat(totalAmountStr);
    return isNaN(val) || val <= 0 ? 0 : Math.round(val * 100) / 100;
  }, [totalAmountStr]);

  // Cargar datos iniciales del gasto al abrir
  useEffect(() => {
    if (!isOpen || !expense) return;

    setDescription(expense.description);
    setTotalAmountStr(expense.totalAmount.toString());
    setError(null);
    setIsSubmitting(false);

    const initialPayer = expense.payer?.id || activeMembers[0]?.userId || '';
    setPayerId(initialPayer);

    const participantIds = expense.participants.map((p) => p.user.id);
    setSelectedParticipantIds(participantIds);

    // Mapear los importes que tenía guardados
    const amounts: Record<string, number> = {};
    expense.participants.forEach((p) => {
      amounts[p.user.id] = p.owedAmount;
    });
    setCustomAmounts(amounts);

    // Comprobar si era equitativo o personalizado
    const count = participantIds.length;
    let isOriginallyEqual = false;
    if (count > 0 && expense.totalAmount > 0) {
      const equalSplits = calculateEqualSplit(expense.totalAmount, participantIds);
      isOriginallyEqual = participantIds.every(
        (id) => Math.abs((amounts[id] || 0) - (equalSplits[id] || 0)) < 0.005
      );
    }

    if (isOriginallyEqual) {
      setSplitMode('EQUAL');
      const pMap: Record<string, number> = {};
      const base = Math.floor(10000 / count) / 100;
      participantIds.forEach((id, idx) => {
        pMap[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
      });
      setCustomPercentages(pMap);
    } else {
      setSplitMode('EXACT');
      setCustomPercentages(
        convertAmountsToPercentages(expense.totalAmount, amounts, participantIds)
      );
    }
  }, [isOpen, expense, activeMembers]);

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

  const payerOptions = useMemo<SelectOption[]>(() => {
    return activeMembers.map((member) => ({
      value: member.userId,
      label: `${member.fullName}${member.userId === currentUserId ? ' (Tú)' : ''}`,
      avatar: member.profilePicUrl || undefined,
    }));
  }, [activeMembers, currentUserId]);

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) => {
      const isSelected = prev.includes(userId);
      let next: string[];
      if (isSelected) {
        if (prev.length <= 1) return prev;
        next = prev.filter((id) => id !== userId);
      } else {
        next = [...prev, userId];
      }

      if (splitMode === 'PERCENTAGE') {
        const count = next.length;
        const base = Math.floor(10000 / count) / 100;
        const newP: Record<string, number> = {};
        next.forEach((id, idx) => {
          newP[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
        });
        setCustomPercentages(newP);
      } else if (splitMode === 'EXACT') {
        if (totalAmount > 0) {
          setCustomAmounts(calculateEqualSplit(totalAmount, next));
        }
      }
      return next;
    });
  };

  const handleModeChange = (newMode: ExpenseSplitMode) => {
    if (newMode === splitMode) return;

    if (newMode === 'PERCENTAGE') {
      if (splitMode === 'EXACT' && totalAmount > 0) {
        setCustomPercentages(
          convertAmountsToPercentages(totalAmount, customAmounts, selectedParticipantIds)
        );
      } else {
        const count = selectedParticipantIds.length;
        const base = Math.floor(10000 / count) / 100;
        const newP: Record<string, number> = {};
        selectedParticipantIds.forEach((id, idx) => {
          newP[id] = idx === 0 ? Math.round((100 - base * (count - 1)) * 100) / 100 : base;
        });
        setCustomPercentages(newP);
      }
    } else if (newMode === 'EXACT') {
      if (splitMode === 'PERCENTAGE' && totalAmount > 0) {
        setCustomAmounts(
          convertPercentagesToAmounts(totalAmount, customPercentages, selectedParticipantIds)
        );
      } else if (totalAmount > 0) {
        setCustomAmounts(calculateEqualSplit(totalAmount, selectedParticipantIds));
      }
    }

    setSplitMode(newMode);
  };

  const percentageValidation = useMemo(() => {
    if (splitMode !== 'PERCENTAGE') return { isValid: true, sum: 100, remaining: 0 };
    return validatePercentageSplit(customPercentages, selectedParticipantIds);
  }, [splitMode, customPercentages, selectedParticipantIds]);

  const exactValidation = useMemo(() => {
    if (splitMode !== 'EXACT') return { isValid: true, sum: totalAmount, remaining: 0 };
    return validateExactSplit(totalAmount, customAmounts, selectedParticipantIds);
  }, [splitMode, customAmounts, totalAmount, selectedParticipantIds]);

  const calculatedShares = useMemo<Record<string, number>>(() => {
    if (totalAmount <= 0 || selectedParticipantIds.length === 0) return {};

    if (splitMode === 'EQUAL') {
      return calculateEqualSplit(totalAmount, selectedParticipantIds);
    }

    if (splitMode === 'PERCENTAGE') {
      return convertPercentagesToAmounts(totalAmount, customPercentages, selectedParticipantIds);
    }

    if (splitMode === 'EXACT') {
      return customAmounts;
    }

    return {};
  }, [splitMode, totalAmount, selectedParticipantIds, customPercentages, customAmounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    if (!description.trim()) {
      setError('Debes especificar una descripción del gasto');
      return;
    }

    if (totalAmount <= 0) {
      setError('El importe total debe ser un número mayor que 0');
      return;
    }

    if (!payerId) {
      setError('Debes seleccionar quién pagó el gasto');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setError('Debes seleccionar al menos a un participante');
      return;
    }

    let customSplitsPayload: ExpenseParticipantShareDto[] | undefined = undefined;

    if (splitMode === 'PERCENTAGE') {
      if (!percentageValidation.isValid) {
        setError(percentageValidation.error || 'La suma de los porcentajes debe ser exactamente 100%');
        return;
      }
      const totalCents = toCents(totalAmount);
      let allocatedCents = 0;
      customSplitsPayload = selectedParticipantIds.map((id, index) => {
        const pct = customPercentages[id] || 0;
        let cents = Math.round((pct / 100) * totalCents);
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
      customSplitsPayload = selectedParticipantIds.map((id) => ({
        userId: id,
        amount: fromCents(toCents(customAmounts[id] || 0)),
      }));
    }

    const payload: UpdateExpenseRequest = {
      description: description.trim(),
      totalAmount,
      payerId,
      participantIds: selectedParticipantIds,
      customSplits: customSplitsPayload,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateExpense(expense.id, payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el gasto';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-lg w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h2 id={modalTitleId} className="text-lg font-bold text-on-surface">
              Editar Gasto
            </h2>
            <p className="text-xs text-secondary">
              Modifica la descripción, importe, pagador o participantes del gasto.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/20 rounded-xl text-xs text-error font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Concepto e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="edit-expense-desc" className="block text-xs font-semibold text-on-surface mb-1">
                Concepto del Gasto
              </label>
              <input
                id="edit-expense-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Compra supermercado, Factura de luz..."
                maxLength={255}
                required
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="edit-expense-amount" className="block text-xs font-semibold text-on-surface mb-1">
                Importe Total (€)
              </label>
              <input
                id="edit-expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface font-semibold placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Selector de Pagador */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              ¿Quién pagó el gasto?
            </label>
            <Select
              options={payerOptions}
              value={payerId}
              onChange={(val) => setPayerId(val)}
              placeholder="Seleccionar pagador..."
            />
          </div>

          {/* Selector de Modalidad de Reparto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-on-surface">Modalidad de reparto</label>
              <span className="text-[11px] text-secondary">
                {splitMode === 'EQUAL' && 'División equitativa a partes iguales'}
                {splitMode === 'PERCENTAGE' && 'Porcentajes individuales (%)'}
                {splitMode === 'EXACT' && 'Importes exactos individuales (€)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container rounded-xl">
              <button
                type="button"
                onClick={() => handleModeChange('EQUAL')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  splitMode === 'EQUAL'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Equitativo</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('PERCENTAGE')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  splitMode === 'PERCENTAGE'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Porcentaje</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('EXACT')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  splitMode === 'EXACT'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Exacto</span>
              </button>
            </div>
          </div>

          {/* Validación y Avisos según Modalidad */}
          {splitMode === 'PERCENTAGE' && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                percentageValidation.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {percentageValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  Suma total: <strong>{percentageValidation.sum.toFixed(2)}%</strong>
                </span>
              </div>
              {!percentageValidation.isValid && (
                <span className="font-semibold text-[11px]">
                  {percentageValidation.remaining > 0
                    ? `Falta ${percentageValidation.remaining.toFixed(2)}%`
                    : `Sobra ${Math.abs(percentageValidation.remaining).toFixed(2)}%`}
                </span>
              )}
            </div>
          )}

          {splitMode === 'EXACT' && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                exactValidation.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {exactValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  Suma: <strong>{exactValidation.sum.toFixed(2)} €</strong> /{' '}
                  {totalAmount.toFixed(2)} €
                </span>
              </div>
              {!exactValidation.isValid && (
                <span className="font-semibold text-[11px]">
                  {exactValidation.remaining > 0
                    ? `Faltan ${exactValidation.remaining.toFixed(2)} €`
                    : `Sobran ${Math.abs(exactValidation.remaining).toFixed(2)} €`}
                </span>
              )}
            </div>
          )}

          {/* Lista de Participantes y Cuotas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Participantes en el gasto ({selectedParticipantIds.length}/{activeMembers.length})
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedParticipantIds(activeMembers.map((m) => m.userId))}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Todos
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeMembers.map((member) => {
                const isSelected = selectedParticipantIds.includes(member.userId);
                const shareAmount = calculatedShares[member.userId] ?? 0;

                return (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-surface border-outline-variant/80 shadow-2xs'
                        : 'bg-surface-container-low/40 border-transparent opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleParticipant(member.userId)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                      />
                      <div className="flex items-center gap-2">
                        {member.profilePicUrl ? (
                          <img
                            src={member.profilePicUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-on-surface">
                          {member.fullName}
                          {member.userId === currentUserId && ' (Tú)'}
                        </span>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-2 shrink-0">
                        {splitMode === 'PERCENTAGE' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={customPercentages[member.userId] ?? ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCustomPercentages((prev) => ({
                                  ...prev,
                                  [member.userId]: Math.min(100, Math.max(0, val)),
                                }));
                              }}
                              className="w-16 px-2 py-1 bg-surface-container border border-outline-variant rounded-lg text-xs text-right font-medium text-on-surface"
                            />
                            <span className="text-xs text-secondary font-semibold">%</span>
                          </div>
                        )}

                        {splitMode === 'EXACT' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={customAmounts[member.userId] ?? ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [member.userId]: Math.max(0, val),
                                }));
                              }}
                              className="w-20 px-2 py-1 bg-surface-container border border-outline-variant rounded-lg text-xs text-right font-medium text-on-surface"
                            />
                            <span className="text-xs text-secondary font-semibold">€</span>
                          </div>
                        )}

                        <span className="text-xs font-bold text-on-surface min-w-16 text-right">
                          {shareAmount.toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/40 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                selectedParticipantIds.length === 0 ||
                (splitMode === 'PERCENTAGE' && !percentageValidation.isValid) ||
                (splitMode === 'EXACT' && !exactValidation.isValid)
              }
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
