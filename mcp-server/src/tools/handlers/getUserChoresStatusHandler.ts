import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { GET_USER_CHORES_STATUS_TOOL } from "../../schemas/toolSchemas.js";
import { IHomeChoreClient, homeChoreClient } from "../../clients/homeChoreClient.js";
import { SecurityContextHolder } from "../../core/security/securityContext.js";

export class GetUserChoresStatusHandler implements IMcpToolHandler<Record<string, never>> {
  public readonly definition = GET_USER_CHORES_STATUS_TOOL;
  public readonly requiredRole = "USER" as const;

  constructor(private readonly client: IHomeChoreClient = homeChoreClient) {}

  public async execute(): Promise<ToolExecutionResult> {
    const context = SecurityContextHolder.getContext();
    const currentUserId = context.userId;

    const homes = await this.client.getUserHomes("ACTIVE");

    if (!homes || homes.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `El usuario autenticado (${context.email}) no forma parte de ningun hogar activo actualmente.`
          }
        ]
      };
    }

    const primaryHome = homes[0];

    const [pendingChores, leaderboard] = await Promise.all([
      this.client.getPendingChores(primaryHome.id, currentUserId),
      this.client.getLeaderboard(primaryHome.id, "WEEKLY")
    ]);

    const scoreList = leaderboard?.scores ?? [];
    const userRankIndex = scoreList.findIndex((entry) => entry.userId === currentUserId);
    const userRankEntry = userRankIndex !== -1 ? scoreList[userRankIndex] : undefined;

    const choreSummary = {
      hogar: {
        id: primaryHome.id,
        nombre: primaryHome.name
      },
      usuario: {
        id: currentUserId,
        email: context.email,
        rangoActual: userRankIndex !== -1 ? `#${userRankIndex + 1} de ${scoreList.length}` : "Sin clasificar",
        puntuacionSemanal: userRankEntry?.currentPoints ?? 0,
        tareasCompletadasEstaSemana: userRankEntry?.completedCount ?? 0,
        tareasPendientes: userRankEntry?.pendingCount ?? 0
      },
      tareasPendientesAsignadas: pendingChores.map((c) => ({
        id: c.id,
        titulo: c.title,
        descripcion: c.description ?? "",
        fechaLimite: c.dueDate ?? "Sin fecha limite",
        puntos: c.basePoints ?? c.points ?? 0
      })),
      tablaClasificacionHogar: scoreList.map((entry, idx) => ({
        posicion: idx + 1,
        nombre: entry.fullName || entry.nickname,
        puntos: entry.currentPoints,
        tareasRealizadas: entry.completedCount
      }))
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(choreSummary, null, 2)
        }
      ]
    };
  }
}
