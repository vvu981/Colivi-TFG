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
  | 'EXPENSE_DELETED'
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

/**
 * Proyección de un participante y su cuota debida dentro de un gasto.
 */
export interface ExpenseParticipantResponseDto {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName1: string;
    lastName2?: string | null;
    profilePicUrl?: string | null;
  };
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
  payer: {
    id: string;
    email: string;
    firstName: string;
    lastName1: string;
    lastName2?: string | null;
    profilePicUrl?: string | null;
  };
  createdAt: string;
  participants: ExpenseParticipantResponseDto[];
}

/**
 * Proyección del balance neto de un miembro en el hogar.
 * balance > 0: El grupo le debe dinero (círculo verde en UI).
 * balance < 0: Debe dinero al grupo (círculo rojo en UI).
 */
export interface BalanceResponseDto {
  userId: string;
  fullName: string;
  email: string;
  profilePicUrl?: string | null;
  balance: number;
}

/**
 * Proyección de una transferencia óptima sugerida por el algoritmo de simplificación de deudas.
 */
export interface DebtTransferResponseDto {
  fromUserId: string;
  fromUserFullName: string;
  fromUserProfilePicUrl?: string | null;
  toUserId: string;
  toUserFullName: string;
  toUserProfilePicUrl?: string | null;
  amount: number;
}

/**
 * Modalidad de reparto de un gasto dentro del formulario.
 */
export type ExpenseSplitMode = 'EQUAL' | 'PERCENTAGE' | 'EXACT';
