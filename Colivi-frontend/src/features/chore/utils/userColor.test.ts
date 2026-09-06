import { describe, it, expect } from 'vitest';
import {
  MEMBER_PALETTE,
  DEFAULT_MEMBER_COLOR,
  getMemberColor,
  hexToRgba,
  getChorePillStyles,
  getChoreBadgeStyles,
} from './userColor';

describe('userColor utilities', () => {
  it('should have 10 harmonic colors in MEMBER_PALETTE', () => {
    expect(MEMBER_PALETTE).toHaveLength(10);
    MEMBER_PALETTE.forEach((option) => {
      expect(option.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(option.name).toBeTruthy();
    });
  });

  it('should return DEFAULT_MEMBER_COLOR when color is null or undefined', () => {
    expect(getMemberColor(null)).toBe(DEFAULT_MEMBER_COLOR);
    expect(getMemberColor(undefined)).toBe(DEFAULT_MEMBER_COLOR);
    expect(getMemberColor('')).toBe(DEFAULT_MEMBER_COLOR);
    expect(getMemberColor('invalid')).toBe(DEFAULT_MEMBER_COLOR);
  });

  it('should return valid hex color as is', () => {
    expect(getMemberColor('#10B981')).toBe('#10B981');
    expect(getMemberColor('#E11D48')).toBe('#E11D48');
  });

  it('should convert hex to rgba properly', () => {
    const rgba = hexToRgba('#4F46E5', 0.5);
    expect(rgba).toBe('rgba(79, 70, 229, 0.5)');
  });

  it('should generate proper pill styles for chore calendar', () => {
    const styles = getChorePillStyles('#059669');
    expect(styles.color).toBe('#059669');
    expect(styles.backgroundColor).toBe('rgba(5, 150, 105, 0.14)');
  });

  it('should generate proper badge styles for chore list', () => {
    const styles = getChoreBadgeStyles('#D97706');
    expect(styles.color).toBe('#D97706');
    expect(styles.backgroundColor).toBe('rgba(217, 119, 6, 0.18)');
  });
});
