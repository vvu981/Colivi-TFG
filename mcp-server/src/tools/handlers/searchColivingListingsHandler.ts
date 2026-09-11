import { z } from "zod";
import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { SEARCH_COLIVING_LISTINGS_TOOL } from "../../schemas/toolSchemas.js";
import { IListingClient, listingClient } from "../../clients/listingClient.js";
import { VibeClassifier, VibeType } from "../../domain/vibeClassifier.js";
import { InvalidArgumentError } from "../../core/errors/mcpError.js";

const searchInputSchema = z.object({
  location: z.string().min(1, "Location is required"),
  maxPrice: z.number().positive().optional(),
  requiredVibe: z.enum(["TIDY", "SOCIAL", "QUIET", "ANY"]).optional()
});

type SearchInput = z.infer<typeof searchInputSchema>;

export class SearchColivingListingsHandler implements IMcpToolHandler<SearchInput> {
  public readonly definition = SEARCH_COLIVING_LISTINGS_TOOL;

  constructor(private readonly client: IListingClient = listingClient) {}

  public async execute(rawArgs: SearchInput): Promise<ToolExecutionResult> {
    const parseResult = searchInputSchema.safeParse(rawArgs);
    if (!parseResult.success) {
      throw new InvalidArgumentError(
        `Invalid search arguments: ${parseResult.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const { location, maxPrice, requiredVibe } = parseResult.data;
    const PAGE_SIZE = 50;

    const catalogPage = await this.client.searchCatalog({
      city: location,
      maxPrice,
      size: PAGE_SIZE
    });

    const totalElements = catalogPage.totalElements ?? catalogPage.content.length;

    const enrichedListings = VibeClassifier.enrichAndFilter(
      catalogPage.content,
      requiredVibe as VibeType | undefined
    );

    if (enrichedListings.length === 0) {
      // F-17: Incluir contexto sobre si la busqueda fue truncada para que el LLM
      // no informe erroneamente que no hay anuncios cuando puede haberlos en otras paginas.
      const truncationContext =
        totalElements > catalogPage.content.length
          ? ` (solo se analizaron ${catalogPage.content.length} de ${totalElements} anuncios disponibles)`
          : "";
      return {
        content: [
          {
            type: "text",
            text: `No se encontraron anuncios de coliving en "${location}" con los criterios especificados (precio max: ${maxPrice ?? "sin limite"}, ambiente: ${requiredVibe ?? "cualquiera"})${truncationContext}.`
          }
        ]
      };
    }

    // Indicar al LLM si los resultados provienen de un conjunto truncado
    const resultsTruncationNote =
      totalElements > catalogPage.content.length
        ? `\n[AVISO: Se analizaron ${catalogPage.content.length} de ${totalElements} anuncios disponibles en "${location}". Los resultados pueden ser parciales.]`
        : "";

    const formattedListings = enrichedListings.map((item) => ({
      id: item.id,
      titulo: item.title,
      precioMes: `${item.pricePerMonth} EUR`,
      direccion: item.accommodation?.address ?? "Ubicacion no detallada",
      habitacionesDisponibles: `${item.accommodation?.freeRooms ?? 0} de ${item.accommodation?.totalRooms ?? 0}`,
      ambienteClasificado: item.computedVibe,
      anfitrion: item.hostNickname ?? "No especificado",
      amenidades: item.accommodation?.amenities ?? []
    }));

    return {
      content: [
        {
          type: "text",
          text:
            JSON.stringify(
              {
                totalEncontrados: enrichedListings.length,
                filtrosAplicados: { location, maxPrice, requiredVibe: requiredVibe ?? "ANY" },
                anuncios: formattedListings
              },
              null,
              2
            ) + resultsTruncationNote
        }
      ]
    };
  }
}
