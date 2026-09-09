import { z } from "zod";
import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { GET_MODERATION_QUEUE_TOOL } from "../../schemas/toolSchemas.js";
import { IReportClient, reportClient, ReportTargetType } from "../../clients/reportClient.js";
import { AuthorizationGuard } from "../../core/security/authorizationGuard.js";
import { InvalidArgumentError } from "../../core/errors/mcpError.js";

const moderationInputSchema = z.object({
  targetType: z.enum(["USER", "LISTING"], {
    errorMap: () => ({ message: "targetType must be either 'USER' or 'LISTING'" })
  })
});

type ModerationInput = z.infer<typeof moderationInputSchema>;

export class GetModerationQueueHandler implements IMcpToolHandler<ModerationInput> {
  public readonly definition = GET_MODERATION_QUEUE_TOOL;
  public readonly requiredRole = "ADMIN" as const;

  constructor(private readonly client: IReportClient = reportClient) {}

  public async execute(rawArgs: ModerationInput): Promise<ToolExecutionResult> {
    // 1. Verificación estricta de privilegios de Administrador (RBAC)
    const adminContext = AuthorizationGuard.assertAdmin();

    // 2. Validación de argumentos de entrada
    const parseResult = moderationInputSchema.safeParse(rawArgs);
    if (!parseResult.success) {
      throw new InvalidArgumentError(
        `Invalid moderation arguments: ${parseResult.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const { targetType } = parseResult.data;

    // 3. Consulta al endpoint administrativo de Spring Boot
    const reportPage = await this.client.getMostReported({
      targetType: targetType as ReportTargetType,
      size: 10
    });

    if (!reportPage.content || reportPage.content.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No hay denuncias pendientes de revision para entidades de tipo [${targetType}].`
          }
        ]
      };
    }

    const formattedQueue = reportPage.content.map((item, index) => ({
      prioridad: index + 1,
      targetId: item.targetId,
      tipoEntidad: item.targetType,
      denunciasPendientes: item.pendingCount ?? item.reportCount ?? 0,
      totalHistoricoDenuncias: item.totalCount ?? item.pendingCount ?? 0,
      accionRecomendada:
        item.pendingCount >= 5
          ? "URGENTE: Umbral preventivo superado. Revisar baneo o suspension inmediata."
          : "AUDITORIA: Revisar detalles de reportes asociados."
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              auditorAdmin: {
                id: adminContext.userId,
                email: adminContext.email
              },
              tipoAuditado: targetType,
              totalObjetivosConDenuncias: reportPage.totalElements,
              top10Criticos: formattedQueue
            },
            null,
            2
          )
        }
      ]
    };
  }
}
