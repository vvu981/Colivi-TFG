export type ReportTargetType = 'LISTING' | 'USER' | 'CONVERSATION';

export interface ReportFeedbackResponse {
  id: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  resolvedAt: string;
}


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

export const USER_REPORT_REASONS: ReportReasonOption[] = [
  {
    reason: 'HARASSMENT',
    label: 'Acoso o comportamiento hostil',
    description: 'Mensajes amenazantes, insultos, intimidación o conducta inapropiada hacia otros usuarios.',
  },
  {
    reason: 'FRAUD',
    label: 'Fraude, estafa o suplantación de identidad',
    description: 'Uso de identidad falsa, solicitud de transferencias sospechosas o intento de engaño.',
  },
  {
    reason: 'SPAM',
    label: 'Spam o publicidad no autorizada',
    description: 'Envío reiterado de enlaces comerciales externos o mensajes automáticos no deseados.',
  },
  {
    reason: 'INAPPROPRIATE_CONTENT',
    label: 'Contenido o foto de perfil inapropiada',
    description: 'Fotos o textos discriminatorios, ofensivos o que infringen las normas comunitarias.',
  },
  {
    reason: 'OTHER',
    label: 'Otro motivo',
    description: 'Cualquier otra infracción grave de las normas de convivencia o de la plataforma.',
  },
];

export const CONVERSATION_REPORT_REASONS: ReportReasonOption[] = [
  {
    reason: 'HARASSMENT',
    label: 'Acoso, insultos o mensajes hostiles',
    description: 'El interlocutor utiliza un lenguaje ofensivo, amenazante o intimidatorio en el chat.',
  },
  {
    reason: 'FRAUD',
    label: 'Intento de estafa o pago externo',
    description: 'Petición de adelantos o fianzas por fuera de Colivi o información engañosa sobre el acuerdo.',
  },
  {
    reason: 'SPAM',
    label: 'Spam o publicidad no solicitada',
    description: 'Difusión de enlaces comerciales ajenos, promociones o mensajes automáticos masivos.',
  },
  {
    reason: 'INAPPROPRIATE_CONTENT',
    label: 'Contenido inapropiado o discriminatorio',
    description: 'Comentarios discriminatorios, vejatorios o que vulneran las políticas comunitarias de la plataforma.',
  },
  {
    reason: 'OTHER',
    label: 'Otro motivo',
    description: 'Cualquier otra irregularidad grave observada en el transcurso de esta conversación.',
  },
];

