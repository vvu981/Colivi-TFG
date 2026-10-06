/**
 * Utilidades puras para el cálculo y validación matemática de repartos de gastos.
 * Utiliza aritmética de céntimos enteros para evitar imprecisiones de punto flotante en JavaScript.
 */

export interface SplitValidationResult {
  isValid: boolean;
  sum: number;
  remaining: number;
  error?: string;
}

/**
 * Convierte un importe en euros a céntimos enteros para cálculos sin imprecisión.
 */
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convierte céntimos enteros a importe en euros con 2 decimales.
 */
export const fromCents = (cents: number): number => {
  return cents / 100;
};

/**
 * Reparte un importe total de forma equitativa entre los participantes,
 * distribuyendo los céntimos de residuo equitativamente entre los primeros participantes.
 */
export const calculateEqualSplit = (
  totalAmount: number,
  participantIds: string[]
): Record<string, number> => {
  const result: Record<string, number> = {};
  const uniqueIds = Array.from(new Set(participantIds));
  const n = uniqueIds.length;

  if (n === 0 || totalAmount <= 0) {
    uniqueIds.forEach((id) => {
      result[id] = 0;
    });
    return result;
  }

  const totalCents = toCents(totalAmount);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents % n;

  uniqueIds.forEach((id, index) => {
    const extraCent = index < remainderCents ? 1 : 0;
    result[id] = fromCents(baseCents + extraCent);
  });

  return result;
};

/**
 * Convierte un mapa de porcentajes a importes en euros según el importe total.
 */
export const convertPercentagesToAmounts = (
  totalAmount: number,
  percentages: Record<string, number>,
  participantIds: string[]
): Record<string, number> => {
  const amounts: Record<string, number> = {};
  const totalCents = toCents(totalAmount);

  participantIds.forEach((id) => {
    const pct = percentages[id] || 0;
    const cents = Math.round((pct / 100) * totalCents);
    amounts[id] = fromCents(cents);
  });

  return amounts;
};

/**
 * Convierte un mapa de importes exactos en euros a porcentajes respecto al total.
 */
export const convertAmountsToPercentages = (
  totalAmount: number,
  amounts: Record<string, number>,
  participantIds: string[]
): Record<string, number> => {
  const percentages: Record<string, number> = {};

  if (totalAmount <= 0) {
    participantIds.forEach((id) => {
      percentages[id] = 0;
    });
    return percentages;
  }

  participantIds.forEach((id) => {
    const amt = amounts[id] || 0;
    const pct = Math.round((amt / totalAmount) * 10000) / 100;
    percentages[id] = pct;
  });

  return percentages;
};

/**
 * Valida que la suma de porcentajes no supere el 100% y comprueba si cuadra exactamente al 100%.
 */
export const validatePercentageSplit = (
  percentages: Record<string, number>,
  participantIds: string[]
): SplitValidationResult => {
  let sum = 0;

  participantIds.forEach((id) => {
    const val = percentages[id] || 0;
    sum += val;
  });

  // Redondear suma a 2 decimales para evitar artefactos de IEEE 754
  sum = Math.round(sum * 100) / 100;

  if (sum > 100) {
    return {
      isValid: false,
      sum,
      remaining: 0,
      error: `La suma de porcentajes (${sum}%) no puede superar el 100%`,
    };
  }

  const remaining = Math.max(0, Math.round((100 - sum) * 100) / 100);
  const isValid = Math.abs(sum - 100) < 0.01;

  return {
    isValid,
    sum,
    remaining,
    error: !isValid && sum < 100 ? `Falta asignar un ${remaining}% para completar el 100%` : undefined,
  };
};

/**
 * Valida que la suma de importes exactos no supere el total del gasto y comprueba si cuadra exactamente.
 */
export const validateExactSplit = (
  totalAmount: number,
  amounts: Record<string, number>,
  participantIds: string[]
): SplitValidationResult => {
  const totalCents = toCents(totalAmount);
  let sumCents = 0;

  participantIds.forEach((id) => {
    const amt = amounts[id] || 0;
    sumCents += toCents(amt);
  });

  const sum = fromCents(sumCents);
  const remainingCents = totalCents - sumCents;

  if (sumCents > totalCents) {
    return {
      isValid: false,
      sum,
      remaining: 0,
      error: `La suma de las partes (${sum.toFixed(2)} €) no puede superar el gasto completo (${totalAmount.toFixed(2)} €)`,
    };
  }

  const remaining = Math.max(0, fromCents(remainingCents));
  const isValid = sumCents === totalCents && totalCents > 0;

  return {
    isValid,
    sum,
    remaining,
    error:
      !isValid && sumCents < totalCents
        ? `Faltan ${remaining.toFixed(2)} € por asignar para completar el total`
        : undefined,
  };
};
