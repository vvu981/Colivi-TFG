import api from '../../../lib/api';
import type {
  HomeMemberStatus,
  HomeResponseDto,
  HomeDetailResponseDto,
  ActivityLogResponseDto,
  CreateHomeRequest,
  JoinHomeRequest,
  ForceExpelRequestDto,
  Page,
} from '../types';

export const homeService = {
  /**
   * Obtiene la lista de hogares del usuario autenticado, filtrados opcionalmente por estado.
   */
  async getUserHomes(status?: HomeMemberStatus): Promise<HomeResponseDto[]> {
    const params = status ? { status } : {};
    const response = await api.get<HomeResponseDto[]>('/homes', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle completo de un hogar específico incluyendo sus miembros.
   */
  async getHomeDetail(homeId: string): Promise<HomeDetailResponseDto> {
    const response = await api.get<HomeDetailResponseDto>(`/homes/${homeId}`);
    return response.data;
  },

  /**
   * Crea un nuevo hogar asignando al creador como Administrador.
   */
  async createHome(data: CreateHomeRequest): Promise<HomeDetailResponseDto> {
    const response = await api.post<HomeDetailResponseDto>('/homes', data);
    return response.data;
  },

  /**
   * Se une a un hogar existente mediante su código de invitación.
   */
  async joinHome(data: JoinHomeRequest): Promise<HomeDetailResponseDto> {
    const response = await api.post<HomeDetailResponseDto>('/homes/join', data);
    return response.data;
  },

  /**
   * Abandona el hogar (transición ACTIVE -> LEFT).
   */
  async leaveHome(homeId: string): Promise<void> {
    await api.patch(`/homes/${homeId}/leave`);
  },

  /**
   * Archiva la vista del hogar para ocultarla tras haber salido (LEFT -> ARCHIVED).
   */
  async archiveHome(homeId: string): Promise<void> {
    await api.patch(`/homes/${homeId}/archive`);
  },

  /**
   * Desarchiva el hogar volviendo a colocarlo en la pestaña de Salidos (ARCHIVED -> LEFT).
   */
  async unarchiveHome(homeId: string): Promise<void> {
    await api.patch(`/homes/${homeId}/unarchive`);
  },

  /**
   * Transfiere el rol de Administrador a otro miembro activo del hogar.
   */
  async transferAdmin(homeId: string, targetUserId: string): Promise<void> {
    await api.patch(`/homes/${homeId}/transfer-admin`, null, {
      params: { targetUserId },
    });
  },

  /**
   * Expulsa a un miembro activo (requiere que tenga balance cero).
   */
  async expelMember(homeId: string, targetUserId: string): Promise<void> {
    await api.patch(`/homes/${homeId}/members/${targetUserId}/expel`);
  },

  /**
   * Expulsa forzosamente a un miembro activo liquidando su deuda/saldo con un gasto compensatorio.
   */
  async forceExpelMember(
    homeId: string,
    targetUserId: string,
    reason?: string
  ): Promise<void> {
    const body: ForceExpelRequestDto | null = reason ? { reason } : null;
    await api.patch(`/homes/${homeId}/members/${targetUserId}/force-expel`, body);
  },

  /**
   * Regenera el código de invitación del hogar (solo para administradores).
   */
  async regenerateInvitationCode(homeId: string): Promise<HomeDetailResponseDto> {
    const response = await api.patch<HomeDetailResponseDto>(
      `/homes/${homeId}/invitation-code/regenerate`
    );
    return response.data;
  },

  /**
   * Ejecuta el borrado lógico del hogar (cuando el admin es el único miembro activo).
   */
  async deleteHome(homeId: string): Promise<void> {
    await api.delete(`/homes/${homeId}`);
  },

  /**
   * Obtiene el feed paginado de actividades y auditoría del hogar.
   */
  async getHomeActivities(
    homeId: string,
    page: number = 0,
    size: number = 20
  ): Promise<Page<ActivityLogResponseDto>> {
    const response = await api.get<Page<ActivityLogResponseDto>>(
      `/homes/${homeId}/activities`,
      {
        params: { page, size },
      }
    );
    return response.data;
  },
};
