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
