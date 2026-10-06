import React from 'react';

export interface ColorOption {
  hex: string;
  name: string;
}

export const MEMBER_PALETTE: ColorOption[] = [
  { hex: '#4F46E5', name: 'Índigo' },
  { hex: '#059669', name: 'Esmeralda' },
  { hex: '#D97706', name: 'Ámbar' },
  { hex: '#E11D48', name: 'Rosa' },
  { hex: '#7C3AED', name: 'Violeta' },
  { hex: '#0284C7', name: 'Cielo' },
  { hex: '#0D9488', name: 'Turquesa' },
  { hex: '#EA580C', name: 'Naranja' },
  { hex: '#DB2777', name: 'Fucsia' },
  { hex: '#475569', name: 'Pizarra' },
];

export const DEFAULT_MEMBER_COLOR = '#4F46E5';

export function getMemberColor(color?: string | null): string {
  if (!color || !/^#([A-Fa-f0-9]{6})$/.test(color)) {
    return DEFAULT_MEMBER_COLOR;
  }
  return color;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) {
    return `rgba(79, 70, 229, ${alpha})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getChorePillStyles(colorHex?: string | null): React.CSSProperties {
  const color = getMemberColor(colorHex);
  return {
    backgroundColor: hexToRgba(color, 0.14),
    color: color,
    borderColor: hexToRgba(color, 0.35),
  };
}

export function getChoreBadgeStyles(colorHex?: string | null): React.CSSProperties {
  const color = getMemberColor(colorHex);
  return {
    backgroundColor: hexToRgba(color, 0.18),
    color: color,
    borderColor: hexToRgba(color, 0.4),
  };
}
