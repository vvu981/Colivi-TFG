import { z } from "zod";
import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { SUMMARIZE_HOST_INBOX_TOOL } from "../../schemas/toolSchemas.js";
import { IMessagingClient, messagingClient } from "../../clients/messagingClient.js";
import { SecurityContextHolder } from "../../core/security/securityContext.js";
import { InvalidArgumentError } from "../../core/errors/mcpError.js";

const summarizeInputSchema = z.object({
  listingId: z.string().uuid("listingId must be a valid UUID").optional()
});

type SummarizeInput = z.infer<typeof summarizeInputSchema>;

export class SummarizeHostInboxHandler implements IMcpToolHandler<SummarizeInput> {
  public readonly definition = SUMMARIZE_HOST_INBOX_TOOL;
  public readonly requiredRole = "USER" as const;

  constructor(private readonly client: IMessagingClient = messagingClient) {}

  public async execute(rawArgs: SummarizeInput): Promise<ToolExecutionResult> {
    const parseResult = summarizeInputSchema.safeParse(rawArgs ?? {});
    if (!parseResult.success) {
      throw new InvalidArgumentError(
        `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const { listingId } = parseResult.data;
    const context = SecurityContextHolder.getContext();

    const inboxPage = await this.client.getInbox({ archived: false, size: 100 });

    // Filtrar solo conversaciones donde el usuario activo actúa como anfitrión (isHost === true)
    let hostConversations = inboxPage.content.filter((c) => c.isHost);

    if (listingId) {
      hostConversations = hostConversations.filter((c) => c.listingId === listingId);
    }

    if (hostConversations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontraron conversaciones activas como anfitrion para el usuario (${context.email})${
              listingId ? ` en el anuncio ${listingId}` : ""
            }.`
          }
        ]
      };
    }

    const unreadConversations = hostConversations.filter((c) => c.unreadCount > 0);

    const candidatesSummary = hostConversations.map((c) => ({
      conversacionId: c.conversationId,
      anuncio: {
        id: c.listingId,
        titulo: c.listingTitle
      },
      candidato: {
        id: c.interlocutorId,
        nombre: c.interlocutorName,
        fotoUrl: c.interlocutorProfilePic ?? "Sin imagen"
      },
      estadoReserva: c.bookingStatus ?? "CONSULTA_PREVIA",
      fechasSolicitadas:
        c.bookingStartDate && c.bookingEndDate
          ? `${c.bookingStartDate} hasta ${c.bookingEndDate}`
          : "Sin periodo seleccionado",
      mensajesNoLeidos: c.unreadCount,
      ultimoMensaje: {
        previsualizacion: c.lastMessagePreview ?? "Sin mensajes",
        fechaHora: c.lastMessageAt ?? "Desconocida"
      }
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              resumen: {
                totalConversacionesAnfitrion: hostConversations.length,
                totalConversacionesConNoLeidos: unreadConversations.length,
                totalMensajesNoLeidos: unreadConversations.reduce((acc, c) => acc + c.unreadCount, 0)
              },
              candidatos: candidatesSummary
            },
            null,
            2
          )
        }
      ]
    };
  }
}
