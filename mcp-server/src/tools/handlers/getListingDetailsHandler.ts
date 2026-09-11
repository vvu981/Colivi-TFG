import { z } from "zod";
import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { GET_LISTING_DETAILS_TOOL } from "../../schemas/toolSchemas.js";
import { IListingClient, listingClient, AccommodationListingItem } from "../../clients/listingClient.js";
import { InvalidArgumentError, BackendIntegrationError } from "../../core/errors/mcpError.js";

const listingDetailsInputSchema = z.object({
  listingId: z.string().trim().min(1, "listingId is required")
});

type ListingDetailsInput = z.infer<typeof listingDetailsInputSchema>;

export class GetListingDetailsHandler implements IMcpToolHandler<ListingDetailsInput> {
  public readonly definition = GET_LISTING_DETAILS_TOOL;

  constructor(private readonly client: IListingClient = listingClient) {}

  public async execute(rawArgs: ListingDetailsInput): Promise<ToolExecutionResult> {
    const parseResult = listingDetailsInputSchema.safeParse(rawArgs);
    if (!parseResult.success) {
      throw new InvalidArgumentError(
        `Invalid listing arguments: ${parseResult.error.errors.map((e) => e.message).join(", ")}`
      );
    }

    const { listingId } = parseResult.data;

    // BUG-02: ColiviHttpClient lanza BackendIntegrationError con status 404 si el anuncio no existe.
    // Se captura controladamente para retornar una respuesta semántica sin fallar la herramienta con isError: true.
    let listing: AccommodationListingItem | undefined;
    try {
      listing = await this.client.getListingById(listingId);
    } catch (error) {
      if (error instanceof BackendIntegrationError && error.statusCode === 404) {
        return {
          content: [
            {
              type: "text",
              text: `No se encontro el anuncio de alojamiento con ID: ${listingId}`
            }
          ]
        };
      }
      throw error;
    }

    if (!listing || !listing.id) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontro el anuncio de alojamiento con ID: ${listingId}`
          }
        ]
      };
    }

    const fichaTecnica = this.formatListingDetails(listing);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(fichaTecnica, null, 2)
        }
      ]
    };
  }

  private formatListingDetails(listing: AccommodationListingItem) {
    const rawAmenities = listing.accommodation?.amenities ?? [];
    const amenitiesSet = new Set(rawAmenities.map((a) => a.toUpperCase()));

    const petsAllowed = amenitiesSet.has("PETS_ALLOWED");
    const smokingAllowed = amenitiesSet.has("SMOKING_ALLOWED");

    const coexistenceRules = {
      mascotasPermitidas: petsAllowed
        ? "PERMITIDO: Se admiten mascotas en el inmueble."
        : "NO PERMITIDO: No se admiten mascotas.",
      tabacoPermitido: smokingAllowed
        ? "PERMITIDO: Esta permitido fumar en zonas habilitadas."
        : "NO PERMITIDO: Estrictamente prohibido fumar en la vivienda."
    };

    const technicalAmenities = rawAmenities.filter(
      (a) => a.toUpperCase() !== "PETS_ALLOWED" && a.toUpperCase() !== "SMOKING_ALLOWED"
    );

    const priceMonth = listing.pricePerMonth ?? 0;
    const deposit = listing.securityDeposit ?? 0;

    return {
      anuncio: {
        id: listing.id,
        titulo: listing.title,
        descripcion: listing.description,
        tipoAlquiler: listing.rentalType,
        estadoDisponibilidad: listing.status,
        promocionado: listing.isPromoted ?? false,
        fechaPublicacion: listing.createdAt ?? "No especificada"
      },
      desgloseEconomico: {
        precioMensual: `${priceMonth} EUR`,
        fianzaDeposito: `${deposit} EUR`,
        totalPrimerMesEstimado: `${priceMonth + deposit} EUR (primer mes + fianza reembolsable)`
      },
      habitabilidadYDisponibilidad: {
        habitacionesLibres: listing.accommodation?.freeRooms ?? 0,
        habitacionesTotales: listing.accommodation?.totalRooms ?? 0,
        ratioDisponibilidad: `${listing.accommodation?.freeRooms ?? 0} de ${listing.accommodation?.totalRooms ?? 0} disponibles`,
        banosTotales: listing.accommodation?.totalBathrooms ?? "No especificado",
        superficieM2: listing.accommodation?.squareMeters ? `${listing.accommodation.squareMeters} m²` : "No especificado"
      },
      serviciosIncluidos: technicalAmenities,
      normasDeConvivencia: coexistenceRules,
      ubicacion: {
        direccion: listing.accommodation?.address ?? "No especificada",
        ciudad: listing.accommodation?.city ?? "No especificada",
        provincia: listing.accommodation?.province ?? "No especificada",
        pais: listing.accommodation?.country ?? "No especificado"
      },
      anfitrion: {
        id: listing.hostId ?? "No especificado",
        nickname: listing.hostNickname ?? "No especificado"
      }
    };
  }
}
