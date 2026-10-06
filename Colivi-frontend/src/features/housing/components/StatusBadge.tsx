import React from 'react';
import type { BookingRequestStatus } from '../types/booking.types';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: BookingRequestStatus;
  className?: string;
}

interface StatusDisplayConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<BookingRequestStatus, StatusDisplayConfig> = {
  PENDING: { 
    label: 'Pendiente', 
    className: 'bg-primary-container text-on-primary-container' 
  },
  ACCEPTED: { 
    label: 'Aceptada', 
    className: 'bg-secondary-container text-on-secondary-container' 
  },
  CONFIRMED: { 
    label: 'Confirmada', 
    className: 'bg-tertiary-container text-on-tertiary-container' 
  },
  REJECTED: { 
    label: 'Rechazada', 
    className: 'bg-error-container text-on-error-container' 
  },
  CANCELLED: { 
    label: 'Cancelada', 
    className: 'bg-error-container text-on-error-container' 
  },
  EXPIRED: { 
    label: 'Caducada', 
    className: 'bg-surface-variant text-on-surface-variant' 
  },
};

const FALLBACK_CONFIG: StatusDisplayConfig = {
  label: 'Desconocido',
  className: 'bg-surface-variant text-on-surface-variant'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_CONFIG[status] || FALLBACK_CONFIG;

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
