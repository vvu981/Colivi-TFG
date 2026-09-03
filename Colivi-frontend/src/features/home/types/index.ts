/**
 * Roles dentro de un hogar.
 */
export type HomeRole = 'ADMIN' | 'MEMBER';

/**
 * Estados posibles de la membresía de un usuario en un hogar.
 * - ACTIVE: Participa y reside activamente.
 * - LEFT: Ha abandonado el hogar pero conserva acceso de solo lectura al historial.
 * - ARCHIVED: Ha archivado el hogar de su vista principal tras haber salido.
 */
export type HomeMemberStatus = 'ACTIVE' | 'LEFT' | 'ARCHIVED';

/**
 * Tipos de actividades registradas en el log de auditoría del hogar.
 */
export type ActivityType =
  | 'HOME_CREATED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'MEMBER_EXPELLED'
  | 'ADMIN_TRANSFERRED'
  | 'HOME_DELETED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'PAYMENT_RECORDED'
  | 'DEBT_SETTLED';

/**
 * Proyección ligera de un hogar para tarjetas y listados.
 */
export interface HomeResponseDto {
  id: string;
  name: string;
  invitationCode?: string | null;
  myRole: HomeRole;
  myStatus: HomeMemberStatus;
  totalActiveMembers: number;
  createdAt: string;
}

/**
 * Proyección de un miembro dentro de un hogar.
 */
export interface HomeMemberResponseDto {
  userId: string;
  fullName: string;
  email: string;
  profilePicUrl?: string | null;
  role: HomeRole;
  status: HomeMemberStatus;
  joinedAt: string;
  leftAt?: string | null;
}

/**
 * Proyección detallada y completa de un hogar con todos sus miembros.
 */
export interface HomeDetailResponseDto {
  id: string;
  name: string;
  invitationCode?: string | null;
  myRole: HomeRole;
  myStatus: HomeMemberStatus;
  totalActiveMembers: number;
  createdAt: string;
  members: HomeMemberResponseDto[];
}

/**
 * Entrada individual del feed de actividad/auditoría del hogar.
 */
export interface ActivityLogResponseDto {
  id: string;
  homeId: string;
  actorId?: string | null;
  actorFullName: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Petición para crear un nuevo hogar.
 */
export interface CreateHomeRequest {
  name: string;
}

/**
 * Petición para unirse a un hogar con código de invitación.
 */
export interface JoinHomeRequest {
  invitationCode: string;
}

/**
 * Petición para expulsión forzosa con liquidación compensatoria.
 */
export interface ForceExpelRequestDto {
  reason?: string;
}

/**
 * Estructura de respuesta paginada genérica de Spring Data.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Desglose individual de cuota de un participante en la petición de creación de gasto.
 */
export interface ExpenseParticipantShareDto {
  userId: string;
  amount: number;
}

/**
 * Petición para registrar un nuevo gasto en el hogar.
 */
export interface CreateExpenseRequest {
  description: string;
  totalAmount: number;
  payerId: string;
  participantIds: string[];
  customSplits?: ExpenseParticipantShareDto[];
}

export interface UpdateExpenseRequest {
  description: string;
  totalAmount: number;
  payerId: string;
  participantIds: string[];
  customSplits?: ExpenseParticipantShareDto[];
}

export interface ExpenseFilterParams {
  search?: string;
  payerId?: string;
  onlyPayments?: boolean;
  page?: number;
  size?: number;
}

/**
 * Petición para registrar un pago directo entre dos convivientes.
 */
export interface RecordPaymentRequest {
  payerId: string;
  receiverId: string;
  amount: number;
  notes?: string;
}

/**
 * Proyección de un participante y su cuota debida dentro de un gasto.
 */
export interface HomeUserProfileDto {
  id: string;
  nickname?: string | null;
  firstName?: string | null;
  lastName1?: string | null;
  lastName2?: string | null;
  profilePicUrl?: string | null;
  createdAt?: string | null;
}

export interface ExpenseParticipantResponseDto {
  id: string;
  user: HomeUserProfileDto;
  owedAmount: number;
}

/**
 * Proyección completa de un gasto registrado en el hogar.
 */
export interface ExpenseResponseDto {
  id: string;
  homeId: string;
  description: string;
  totalAmount: number;
  payer: HomeUserProfileDto;
  createdAt: string;
  isPayment?: boolean;
  participants: ExpenseParticipantResponseDto[];
}

/**
 * Proyección del balance neto de un miembro en el hogar.
 * amount > 0: El grupo le debe dinero (círculo verde en UI).
 * amount < 0: Debe dinero al grupo (círculo rojo en UI).
 */
export interface BalanceResponseDto {
  user?: HomeUserProfileDto;
  amount?: number;
  userId?: string;
  fullName?: string;
  balance?: number;
  profilePicUrl?: string | null;
}

/**
 * Proyección de una transferencia óptima sugerida por el algoritmo de simplificación de deudas.
 */
export interface DebtTransferResponseDto {
  fromUser?: HomeUserProfileDto;
  toUser?: HomeUserProfileDto;
  amount: number;
  fromUserId?: string;
  fromUserFullName?: string;
  toUserId?: string;
  toUserFullName?: string;
}

/**
 * Modalidad de reparto de un gasto dentro del formulario.
 */
export type ExpenseSplitMode = 'EQUAL' | 'PERCENTAGE' | 'EXACT';
