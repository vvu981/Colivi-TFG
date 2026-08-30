// ── Report Enums and Types ─────────────────────────────────────────────

export type ReportTargetType = 'LISTING' | 'USER' | 'HOME' | 'EXPENSE';

export type ReportReason =
  | 'SPAM'
  | 'FRAUD'
  | 'HARASSMENT'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER';

export type ReportStatus =
  | 'PENDING'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'CANCELLED';

// ── Request DTOs ───────────────────────────────────────────────────────

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

// ── Response DTOs ──────────────────────────────────────────────────────

export interface ReportResponse {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  adminNotes?: string;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ── User-friendly reason options ───────────────────────────────────────

export interface ReportReasonOption {
  reason: ReportReason;
  label: string;
  description: string;
}

export const LISTING_REPORT_REASONS: ReportReasonOption[] = [
  {
    reason: 'FRAUD',
    label: 'Fraude o información falsa',
    description: 'El precio, las fotos, las características o la ubicación no coinciden con la realidad.',
  },
  {
    reason: 'SPAM',
    label: 'Spam o publicidad no deseada',
    description: 'Anuncio repetitivo, enlace comercial externo o contenido no relacionado con alojamiento.',
  },
  {
    reason: 'INAPPROPRIATE_CONTENT',
    label: 'Contenido ofensivo o inapropiado',
    description: 'Imágenes, texto o condiciones discriminatorias, ofensivas o ilegales.',
  },
  {
    reason: 'HARASSMENT',
    label: 'Acoso o comportamiento sospechoso',
    description: 'Trato hostil, mensajes sospechosos o solicitud indebida de datos personales por parte del anfitrión.',
  },
  {
    reason: 'OTHER',
    label: 'Otro motivo',
    description: 'Cualquier otra infracción de las normas de convivencia o de la plataforma.',
  },
];
