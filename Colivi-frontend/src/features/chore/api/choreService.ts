import api from '../../../lib/api';
import type {
  ChoreResponseDto,
  CreateChoreRequest,
  ChoreFilterParams,
  ChoreLeaderboardDto,
  DeleteMode,
} from '../types';

export const choreService = {
  /**
   * Obtiene la lista filtrada de tareas domésticas del hogar.
   */
  async getChores(
    homeId: string,
    params?: ChoreFilterParams
  ): Promise<ChoreResponseDto[]> {
    const response = await api.get<ChoreResponseDto[]>(`/homes/${homeId}/chores`, {
      params: {
        assigneeId: params?.assigneeId || undefined,
        status: params?.status || undefined,
        from: params?.from || undefined,
        to: params?.to || undefined,
        period: params?.period || undefined,
      },
    });
    return response.data;
  },

  /**
   * Crea una nueva tarea (o serie recurrente) en el hogar.
   */
  async createChore(
    homeId: string,
    data: CreateChoreRequest
  ): Promise<ChoreResponseDto[]> {
    const response = await api.post<ChoreResponseDto[]>(
      `/homes/${homeId}/chores`,
      data
    );
    return response.data;
  },

  /**
   * Completa una tarea a tiempo o la rescata si está atrasada.
   */
  async completeChore(
    homeId: string,
    choreId: string
  ): Promise<ChoreResponseDto> {
    const response = await api.patch<ChoreResponseDto>(
      `/homes/${homeId}/chores/${choreId}/complete`
    );
    return response.data;
  },

  /**
   * Elimina una tarea individual o una serie hacia adelante.
   */
  async deleteChore(
    homeId: string,
    choreId: string,
    mode: DeleteMode = 'DELETE_SINGLE'
  ): Promise<void> {
    await api.delete(`/homes/${homeId}/chores/${choreId}`, {
      params: { mode },
    });
  },

  /**
   * Obtiene la tabla de clasificación y puntos esperados del hogar.
   */
  async getLeaderboard(
    homeId: string,
    period: 'WEEKLY' | 'MONTHLY' = 'WEEKLY'
  ): Promise<ChoreLeaderboardDto> {
    const response = await api.get<ChoreLeaderboardDto>(
      `/homes/${homeId}/chores/leaderboard`,
      {
        params: { period },
      }
    );
    return response.data;
  },
};
