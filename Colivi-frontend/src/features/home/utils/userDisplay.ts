import type { HomeUserProfileDto } from '../types';

/**
 * Devuelve el nombre completo legible de un usuario o su nickname/fallback.
 */
export const formatUserDisplayName = (
  user?: HomeUserProfileDto | null,
  fallbackName?: string
): string => {
  if (user) {
    const parts = [user.firstName, user.lastName1, user.lastName2].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (user.nickname) return user.nickname;
  }
  return fallbackName || 'Usuario';
};

/**
 * Devuelve la letra inicial en mayúscula de forma segura ante cadenas vacías o undefined.
 */
export const getUserInitial = (name?: unknown): string => {
  if (!name || typeof name !== 'string') return 'U';
  const trimmed = name.trim();
  return (trimmed.charAt(0) || 'U').toUpperCase();
};
