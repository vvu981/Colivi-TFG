import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { GET_USER_CHORES_STATUS_TOOL } from "../../schemas/toolSchemas.js";
import { IHomeChoreClient, homeChoreClient } from "../../clients/homeChoreClient.js";
import { SecurityContextHolder } from "../../core/security/securityContext.js";

export interface UserChoresStatusArgs {
  homeId?: string;
}

export class GetUserChoresStatusHandler implements IMcpToolHandler<UserChoresStatusArgs> {
  public readonly definition = GET_USER_CHORES_STATUS_TOOL;
  public readonly requiredRole = "USER" as const;

  constructor(private readonly client: IHomeChoreClient = homeChoreClient) {}

  public async execute(rawArgs?: UserChoresStatusArgs): Promise<ToolExecutionResult> {
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

    // F-14: Si se proporciona homeId opcional, validar que pertenezca a los hogares activos del usuario
    const requestedHomeId = rawArgs?.homeId?.trim();
    let selectedHome = homes[0];

    if (requestedHomeId) {
      const found = homes.find((h) => h.id === requestedHomeId);
      if (!found) {
        return {
          content: [
            {
              type: "text",
              text: `No se encontró ningún hogar activo con ID "${requestedHomeId}" para el usuario autenticado (${context.email}). Los hogares activos disponibles son: ${homes
                .map((h) => `"${h.name}" (ID: ${h.id})`)
                .join(", ")}.`
            }
          ]
        };
      }
      selectedHome = found;
    }

    // F-14: Informar al LLM sobre la situacion real de multi-hogar para evitar
    // que responda sobre el hogar incorrecto sin saberlo.
    const otherHomes = homes.filter((h) => h.id !== selectedHome.id);
    const multiHomarWarning =
      otherHomes.length > 0
        ? `\n[AVISO: El usuario pertenece a ${homes.length} hogares activos. Se muestran los datos del hogar "${selectedHome.name}" (ID: ${selectedHome.id}). Los otros hogares son: ${otherHomes
            .map((h) => `"${h.name}" (ID: ${h.id})`)
            .join(", ")}.]`
        : "";

    const [pendingChores, leaderboard] = await Promise.all([
      this.client.getPendingChores(selectedHome.id, currentUserId),
      this.client.getLeaderboard(selectedHome.id, "WEEKLY")
    ]);

    const scoreList = leaderboard?.scores ?? [];
    const userRankIndex = scoreList.findIndex((entry) => entry.userId === currentUserId);
    const userRankEntry = userRankIndex !== -1 ? scoreList[userRankIndex] : undefined;

    // F-15: Detectar posible inconsistencia entre los contadores de tareas pendientes.
    // pendingChores es la lista real asignada al usuario; pendingCount del leaderboard
    // puede usar criterios de calculo distintos (tareas sin asignar, etc.).
    const pendingFromList = pendingChores.length;
    const pendingFromRank = userRankEntry?.pendingCount ?? 0;
    const consistencyNote =
      pendingFromList !== pendingFromRank
        ? `\n[NOTA: El sistema reporta ${pendingFromList} tareas pendientes asignadas, pero el ranking indica ${pendingFromRank}. Usa la lista de tareas asignadas como fuente de verdad.]`
        : "";

    const choreSummary = {
      hogar: {
        id: selectedHome.id,
        nombre: selectedHome.name
      },
      usuario: {
        id: currentUserId,
        email: context.email,
        rangoActual: userRankIndex !== -1 ? `#${userRankIndex + 1} de ${scoreList.length}` : "Sin clasificar",
        puntuacionSemanal: userRankEntry?.currentPoints ?? 0,
        tareasCompletadasEstaSemana: userRankEntry?.completedCount ?? 0,
        tareasPendientes: pendingFromList
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
          text: JSON.stringify(choreSummary, null, 2) + multiHomarWarning + consistencyNote
        }
      ]
    };
  }
}
