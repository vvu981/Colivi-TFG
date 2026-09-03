import { describe, it, expect } from 'vitest';
import { formatUserDisplayName, getUserInitial } from './userDisplay';
import type { HomeUserProfileDto } from '../types';

describe('userDisplay utils', () => {
  it('formats full name with first name and both last names', () => {
    const user: HomeUserProfileDto = {
      id: '1',
      firstName: 'Víctor',
      lastName1: 'Vallejo',
      lastName2: 'Uroz',
    };
    expect(formatUserDisplayName(user)).toBe('Víctor Vallejo Uroz');
  });

  it('formats name with first name and single last name', () => {
    const user: HomeUserProfileDto = {
      id: '1',
      firstName: 'María',
      lastName1: 'García',
    };
    expect(formatUserDisplayName(user)).toBe('María García');
  });

  it('falls back to nickname if no first name', () => {
    const user: HomeUserProfileDto = {
      id: '1',
      nickname: 'supervictor',
    };
    expect(formatUserDisplayName(user)).toBe('supervictor');
  });

  it('falls back to provided fallback name if user is undefined', () => {
    expect(formatUserDisplayName(undefined, 'Usuario Anónimo')).toBe('Usuario Anónimo');
  });

  it('returns initial safely from string', () => {
    expect(getUserInitial('Víctor')).toBe('V');
    expect(getUserInitial('  carlos  ')).toBe('C');
    expect(getUserInitial('')).toBe('U');
    expect(getUserInitial(null)).toBe('U');
    expect(getUserInitial(undefined)).toBe('U');
  });
});
