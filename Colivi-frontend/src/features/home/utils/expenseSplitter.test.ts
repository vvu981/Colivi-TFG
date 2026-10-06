import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  convertPercentagesToAmounts,
  convertAmountsToPercentages,
  validatePercentageSplit,
  validateExactSplit,
  toCents,
  fromCents,
} from './expenseSplitter';

describe('expenseSplitter utility', () => {
  it('toCents and fromCents conversion avoids floating point leaks', () => {
    expect(toCents(100.55)).toBe(10055);
    expect(fromCents(10055)).toBe(100.55);
  });

  describe('calculateEqualSplit', () => {
    it('divides exact amounts without remainder', () => {
      const split = calculateEqualSplit(100, ['u1', 'u2']);
      expect(split).toEqual({ u1: 50, u2: 50 });
    });

    it('divides inexact amounts distributing extra cents to the first participants', () => {
      const split = calculateEqualSplit(100, ['u1', 'u2', 'u3']);
      expect(split['u1']).toBe(33.34);
      expect(split['u2']).toBe(33.33);
      expect(split['u3']).toBe(33.33);

      const total = split['u1'] + split['u2'] + split['u3'];
      expect(Math.round(total * 100) / 100).toBe(100);
    });

    it('handles empty participants or zero amount', () => {
      expect(calculateEqualSplit(0, ['u1', 'u2'])).toEqual({ u1: 0, u2: 0 });
      expect(calculateEqualSplit(100, [])).toEqual({});
    });
  });

  describe('convertPercentagesToAmounts and convertAmountsToPercentages', () => {
    it('converts percentages to monetary amounts correctly', () => {
      const pcts = { u1: 50, u2: 25, u3: 25 };
      const amounts = convertPercentagesToAmounts(100, pcts, ['u1', 'u2', 'u3']);
      expect(amounts).toEqual({ u1: 50, u2: 25, u3: 25 });
    });

    it('converts exact amounts to percentages correctly', () => {
      const amounts = { u1: 50, u2: 25, u3: 25 };
      const pcts = convertAmountsToPercentages(100, amounts, ['u1', 'u2', 'u3']);
      expect(pcts).toEqual({ u1: 50, u2: 25, u3: 25 });
    });
  });

  describe('validatePercentageSplit', () => {
    it('returns valid when sum is exactly 100%', () => {
      const res = validatePercentageSplit({ u1: 50, u2: 50 }, ['u1', 'u2']);
      expect(res.isValid).toBe(true);
      expect(res.sum).toBe(100);
      expect(res.remaining).toBe(0);
      expect(res.error).toBeUndefined();
    });

    it('returns error when sum exceeds 100%', () => {
      const res = validatePercentageSplit({ u1: 60, u2: 50 }, ['u1', 'u2']);
      expect(res.isValid).toBe(false);
      expect(res.sum).toBe(110);
      expect(res.error).toContain('no puede superar el 100%');
    });

    it('indicates remaining percentage when under 100%', () => {
      const res = validatePercentageSplit({ u1: 40, u2: 30 }, ['u1', 'u2']);
      expect(res.isValid).toBe(false);
      expect(res.sum).toBe(70);
      expect(res.remaining).toBe(30);
      expect(res.error).toContain('Falta asignar un 30%');
    });
  });

  describe('validateExactSplit', () => {
    it('returns valid when sum equals totalAmount', () => {
      const res = validateExactSplit(100, { u1: 70, u2: 30 }, ['u1', 'u2']);
      expect(res.isValid).toBe(true);
      expect(res.sum).toBe(100);
      expect(res.remaining).toBe(0);
      expect(res.error).toBeUndefined();
    });

    it('returns error when sum exceeds totalAmount', () => {
      const res = validateExactSplit(100, { u1: 60, u2: 50 }, ['u1', 'u2']);
      expect(res.isValid).toBe(false);
      expect(res.sum).toBe(110);
      expect(res.error).toContain('no puede superar el gasto completo');
    });

    it('indicates remaining amount when under totalAmount', () => {
      const res = validateExactSplit(100, { u1: 35.5, u2: 24.5 }, ['u1', 'u2']);
      expect(res.isValid).toBe(false);
      expect(res.sum).toBe(60);
      expect(res.remaining).toBe(40);
      expect(res.error).toContain('Faltan 40.00 €');
    });
  });
});
