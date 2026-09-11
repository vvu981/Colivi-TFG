import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createDefaultToolRegistry } from "../src/tools/registry.js";
import { ALL_MCP_TOOLS } from "../src/schemas/toolSchemas.js";
import { SearchColivingListingsHandler } from "../src/tools/handlers/searchColivingListingsHandler.js";
import { GetModerationQueueHandler } from "../src/tools/handlers/getModerationQueueHandler.js";
import { GetUserChoresStatusHandler } from "../src/tools/handlers/getUserChoresStatusHandler.js";
import { SummarizeHostInboxHandler } from "../src/tools/handlers/summarizeHostInboxHandler.js";
import { GetMyBookingsStatusHandler } from "../src/tools/handlers/getMyBookingsStatusHandler.js";
import { GetListingDetailsHandler } from "../src/tools/handlers/getListingDetailsHandler.js";
import { SecurityContextHolder } from "../src/core/security/securityContext.js";
import { ForbiddenError, BackendIntegrationError } from "../src/core/errors/mcpError.js";
import { IListingClient, PageResponse, AccommodationListingItem } from "../src/clients/listingClient.js";
import { IReportClient, ReportTargetCount } from "../src/clients/reportClient.js";
import { IHomeChoreClient, HomeSummary, ChoreItem, ChoreLeaderboard } from "../src/clients/homeChoreClient.js";
import { IMessagingClient, ConversationSummary } from "../src/clients/messagingClient.js";
import { IBookingClient, BookingRequestItem } from "../src/clients/bookingClient.js";

function extractText(content: CallToolResult["content"][number] | undefined): string {
  assert.ok(content && content.type === "text", "Expected content block to be of type 'text'");
  return content.text;
}

describe("MCP Tools & Handlers Suite", () => {
  it("should have exactly the 6 required tools registered in schema and registry", () => {
    const registry = createDefaultToolRegistry();
    const definitions = registry.getAllDefinitions();

    assert.equal(definitions.length, 6);
    assert.equal(ALL_MCP_TOOLS.length, 6);

    const names = definitions.map((d) => d.name).sort();
    const expected = [
      "get_listing_details",
      "get_moderation_queue",
      "get_my_bookings_status",
      "get_user_chores_status",
      "search_coliving_listings",
      "summarize_host_inbox"
    ].sort();

    assert.deepEqual(names, expected);
  });

  it("should filter tools by role: USER sees only 5 tools, ADMIN sees all 6", () => {
    const registry = createDefaultToolRegistry();

    const userTools = registry.getDefinitionsForRole("USER");
    assert.equal(userTools.length, 5);
    const userToolNames = userTools.map((t) => t.name);
    assert.ok(!userToolNames.includes("get_moderation_queue"), "USER should not see get_moderation_queue");
    assert.ok(userToolNames.includes("search_coliving_listings"));
    assert.ok(userToolNames.includes("get_user_chores_status"));
    assert.ok(userToolNames.includes("summarize_host_inbox"));
    assert.ok(userToolNames.includes("get_my_bookings_status"));
    assert.ok(userToolNames.includes("get_listing_details"));

    const adminTools = registry.getDefinitionsForRole("ADMIN");
    assert.equal(adminTools.length, 6);
    const adminToolNames = adminTools.map((t) => t.name);
    assert.ok(adminToolNames.includes("get_moderation_queue"));
  });

  it("executeTool: should reject unauthorized execution of ADMIN tool directly from ToolRegistry", async () => {
    const registry = createDefaultToolRegistry();
    const userContext = {
      userId: "user-uuid-1",
      email: "tenant@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      await assert.rejects(
        () => registry.executeTool("get_moderation_queue", { targetType: "USER" }),
        (err: unknown) => err instanceof ForbiddenError
      );
    });
  });

  it("search_coliving_listings: should filter and enrich results with vibe classifier", async () => {
    const mockListings: PageResponse<AccommodationListingItem> = {
      content: [
        {
          id: "listing-1",
          title: "Piso tranquilo para estudiantes",
          description: "Ambiente muy tranquilo y silencioso, ideal para estudiar.",
          pricePerMonth: 450,
          rentalType: "ROOM",
          status: "APPROVED",
          accommodation: {
            id: "acc-1",
            address: "Calle Mayor 10",
            city: "Madrid",
            country: "Spain",
            totalRooms: 4,
            freeRooms: 1,
            amenities: ["DESK", "SILENT_AREA"]
          },
          hostNickname: "carlos_host"
        }
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0
    };

    const mockClient: IListingClient = {
      searchCatalog: async () => mockListings,
      getListingById: async () => ({} as AccommodationListingItem)
    };

    const handler = new SearchColivingListingsHandler(mockClient);
    const result = await handler.execute({ location: "Madrid", requiredVibe: "QUIET" });

    assert.equal(result.isError, undefined);
    assert.equal(result.content.length, 1);
    const text = extractText(result.content[0]);
    assert.match(text, /Madrid/);
    assert.match(text, /QUIET/);
  });

  it("get_moderation_queue: should reject when caller is not ADMIN", async () => {
    const mockReportClient: IReportClient = {
      getMostReported: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      })
    };

    const handler = new GetModerationQueueHandler(mockReportClient);

    const userContext = {
      userId: "user-uuid-1",
      email: "tenant@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      await assert.rejects(
        () => handler.execute({ targetType: "USER" }),
        (err: unknown) => err instanceof ForbiddenError
      );
    });
  });

  it("get_moderation_queue: should return Top 10 when caller is ADMIN", async () => {
    const mockReports: PageResponse<ReportTargetCount> = {
      content: [
        {
          targetId: "target-bad-user",
          targetType: "USER",
          pendingCount: 6,
          totalCount: 8
        }
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0
    };

    const mockReportClient: IReportClient = {
      getMostReported: async () => mockReports
    };

    const handler = new GetModerationQueueHandler(mockReportClient);

    const adminContext = {
      userId: "admin-uuid-1",
      email: "admin@colivi.com",
      role: "ADMIN" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(adminContext, async () => {
      const result = await handler.execute({ targetType: "USER" });
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /target-bad-user/);
      assert.match(text, /URGENTE: Umbral preventivo superado/);
    });
  });

  it("get_user_chores_status: should retrieve user chores and leaderboard for active home", async () => {
    const mockHomes: HomeSummary[] = [{ id: "home-123", name: "Casa Malasaña" }];
    const mockChores: ChoreItem[] = [
      {
        id: "chore-1",
        title: "Limpiar cocina",
        status: "PENDING",
        points: 10
      }
    ];
    const mockLeaderboard: ChoreLeaderboard = {
      period: "WEEKLY",
      scores: [
        {
          userId: "tenant-uuid-1",
          nickname: "victor",
          fullName: "Victor V",
          completedCount: 3,
          currentPoints: 30,
          expectedPoints: 40,
          rescuedCount: 0,
          penalizedCount: 0,
          pendingCount: 1
        }
      ]
    };

    const mockHomeClient: IHomeChoreClient = {
      getUserHomes: async () => mockHomes,
      getPendingChores: async () => mockChores,
      getLeaderboard: async () => mockLeaderboard
    };

    const handler = new GetUserChoresStatusHandler(mockHomeClient);

    const userContext = {
      userId: "tenant-uuid-1",
      email: "victor@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute();
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /Casa Malasaña/);
      assert.match(text, /Limpiar cocina/);
      assert.match(text, /#1 de 1/);
    });
  });

  it("get_user_chores_status: should select requested homeId when user belongs to multiple homes (F-14)", async () => {
    const mockHomes: HomeSummary[] = [
      { id: "home-1", name: "Piso Sol" },
      { id: "home-2", name: "Piso Retiro" }
    ];
    const mockChoresHome2: ChoreItem[] = [
      {
        id: "chore-ret",
        title: "Regar plantas",
        status: "PENDING",
        points: 5
      }
    ];
    const mockLeaderboard: ChoreLeaderboard = {
      period: "WEEKLY",
      scores: [
        {
          userId: "tenant-uuid-1",
          nickname: "victor",
          fullName: "Victor V",
          completedCount: 1,
          currentPoints: 10,
          expectedPoints: 15,
          rescuedCount: 0,
          penalizedCount: 0,
          pendingCount: 1
        }
      ]
    };

    const mockHomeClient: IHomeChoreClient = {
      getUserHomes: async () => mockHomes,
      getPendingChores: async (homeId) => (homeId === "home-2" ? mockChoresHome2 : []),
      getLeaderboard: async () => mockLeaderboard
    };

    const handler = new GetUserChoresStatusHandler(mockHomeClient);
    const userContext = {
      userId: "tenant-uuid-1",
      email: "victor@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute({ homeId: "home-2" });
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /Piso Retiro/);
      assert.match(text, /Regar plantas/);
      assert.match(text, /Piso Sol/); // Aviso de otros hogares activos
    });
  });

  it("get_user_chores_status: should inform user if requested homeId does not exist in their active homes (F-14)", async () => {
    const mockHomes: HomeSummary[] = [{ id: "home-1", name: "Piso Sol" }];
    const mockHomeClient: IHomeChoreClient = {
      getUserHomes: async () => mockHomes,
      getPendingChores: async () => [],
      getLeaderboard: async () => ({ period: "WEEKLY", scores: [] })
    };

    const handler = new GetUserChoresStatusHandler(mockHomeClient);
    const userContext = {
      userId: "tenant-uuid-1",
      email: "victor@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute({ homeId: "home-non-existent" });
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /No se encontró ningún hogar activo con ID "home-non-existent"/);
      assert.match(text, /Piso Sol/);
    });
  });

  it("summarize_host_inbox: should summarize unread messages and candidate profiles", async () => {
    const mockInbox: PageResponse<ConversationSummary> = {
      content: [
        {
          conversationId: "conv-1",
          listingId: "listing-uuid-1",
          listingTitle: "Habitacion Luminosa",
          interlocutorId: "candidate-uuid-1",
          interlocutorName: "Ana Gomez",
          bookingStatus: "PENDING",
          bookingStartDate: "2026-10-01",
          bookingEndDate: "2027-06-30",
          lastMessagePreview: "Hola, me interesa mucho entrar el proximo mes!",
          lastMessageAt: "2026-09-09T10:00:00Z",
          unreadCount: 2,
          isHost: true,
          isArchived: false
        }
      ],
      totalElements: 1,
      totalPages: 1,
      size: 50,
      number: 0
    };

    const mockMessagingClient: IMessagingClient = {
      getInbox: async () => mockInbox
    };

    const handler = new SummarizeHostInboxHandler(mockMessagingClient);

    const hostContext = {
      userId: "host-uuid-1",
      email: "host@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(hostContext, async () => {
      const result = await handler.execute({});
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /Ana Gomez/);
      assert.match(text, /Habitacion Luminosa/);
      assert.match(text, /PENDING/);
    });
  });

  it("search_coliving_listings: should return friendly message when no listings found and throw on invalid args", async () => {
    const mockEmptyClient: IListingClient = {
      searchCatalog: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0
      }),
      getListingById: async () => ({} as AccommodationListingItem)
    };

    const handler = new SearchColivingListingsHandler(mockEmptyClient);
    const emptyResult = await handler.execute({ location: "Toledo" });
    const text = extractText(emptyResult.content[0]);
    assert.match(text, /No se encontraron anuncios de coliving en "Toledo"/);

    await assert.rejects(
      async () => handler.execute({ location: "" }),
      /Invalid search arguments/
    );
  });

  it("get_moderation_queue: should return friendly message when queue is empty and reject on invalid args", async () => {
    const mockEmptyReportClient: IReportClient = {
      getMostReported: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      })
    };

    const handler = new GetModerationQueueHandler(mockEmptyReportClient);
    const adminContext = {
      userId: "admin-1",
      email: "admin@colivi.com",
      role: "ADMIN" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(adminContext, async () => {
      const emptyResult = await handler.execute({ targetType: "USER" });
      const text = extractText(emptyResult.content[0]);
      assert.match(text, /No hay denuncias pendientes de revision/);

      await assert.rejects(
        async () => handler.execute({ targetType: "INVALID" as any }),
        /Invalid moderation arguments/
      );
    });
  });

  it("get_user_chores_status: should return friendly message when user has no active homes", async () => {
    const mockNoHomeClient: IHomeChoreClient = {
      getUserHomes: async () => [],
      getPendingChores: async () => [],
      getLeaderboard: async () => ({ period: "WEEKLY", scores: [] })
    };

    const handler = new GetUserChoresStatusHandler(mockNoHomeClient);
    const userContext = {
      userId: "lonely-user",
      email: "lonely@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute();
      const text = extractText(result.content[0]);
      assert.match(text, /no forma parte de ningun hogar activo actualmente/);
    });
  });

  it("summarize_host_inbox: should return friendly message when host has no matching conversations", async () => {
    const mockEmptyInboxClient: IMessagingClient = {
      getInbox: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 50,
        number: 0
      })
    };

    const handler = new SummarizeHostInboxHandler(mockEmptyInboxClient);
    const hostContext = {
      userId: "host-2",
      email: "host2@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(hostContext, async () => {
      const result = await handler.execute({ listingId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" });
      const text = extractText(result.content[0]);
      assert.match(text, /No se encontraron conversaciones activas como anfitrion/);
    });
  });

  it("get_my_bookings_status: should return friendly message when user has no bookings", async () => {
    const mockEmptyBookingClient: IBookingClient = {
      getMyBookings: async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 50,
        number: 0
      })
    };

    const handler = new GetMyBookingsStatusHandler(mockEmptyBookingClient);
    const userContext = {
      userId: "tenant-uuid-1",
      email: "tenant@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute();
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      assert.match(text, /no tiene solicitudes de reserva registradas actualmente/);
    });
  });

  it("get_my_bookings_status: should flag immediate action when booking is ACCEPTED (deposit payment needed) and summarize", async () => {
    const mockBookings: BookingRequestItem[] = [
      {
        id: "booking-req-1",
        requesterId: "tenant-uuid-1",
        accommodationListingId: "listing-uuid-10",
        startDate: "2026-10-01",
        endDate: "2027-06-30",
        message: "Hola, me gustaria alquilar la habitacion.",
        status: "ACCEPTED",
        createdAt: "2026-09-08T10:00:00Z",
        expiresAt: "2026-09-15T23:59:59Z"
      },
      {
        id: "booking-req-2",
        requesterId: "tenant-uuid-1",
        accommodationListingId: "listing-uuid-20",
        startDate: "2026-11-01",
        endDate: "2027-02-28",
        message: "Segunda opcion.",
        status: "PENDING",
        createdAt: "2026-09-09T12:00:00Z"
      },
      {
        id: "booking-req-3",
        requesterId: "tenant-uuid-1",
        accommodationListingId: "listing-uuid-30",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        message: "Estancia verano.",
        status: "CONFIRMED",
        createdAt: "2026-07-01T10:00:00Z"
      }
    ];

    const mockBookingClient: IBookingClient = {
      getMyBookings: async () => ({
        content: mockBookings,
        totalElements: 3,
        totalPages: 1,
        size: 50,
        number: 0
      })
    };

    const handler = new GetMyBookingsStatusHandler(mockBookingClient);
    const userContext = {
      userId: "tenant-uuid-1",
      email: "tenant@colivi.com",
      role: "USER" as const,
      token: "tok"
    };

    await SecurityContextHolder.run(userContext, async () => {
      const result = await handler.execute();
      assert.equal(result.isError, undefined);
      const text = extractText(result.content[0]);
      const data = JSON.parse(text);

      assert.equal(data.metricas.totalSolicitudes, 3);
      assert.equal(data.metricas.aceptadasRequierenPagoFianza, 1);
      assert.equal(data.metricas.pendientesDeRespuesta, 1);
      assert.equal(data.metricas.confirmadas, 1);

      const accepted = data.solicitudes.find((s: any) => s.id === "booking-req-1");
      assert.ok(accepted);
      assert.equal(accepted.requiereAccionInmediata, true);
      assert.match(accepted.accionRequerida, /URGENTE: Tu solicitud ha sido ACEPTADA/);
      assert.match(accepted.accionRequerida, /2026-09-15T23:59:59Z/);

      const pending = data.solicitudes.find((s: any) => s.id === "booking-req-2");
      assert.ok(pending);
      assert.equal(pending.requiereAccionInmediata, false);
      assert.match(pending.accionRequerida, /En espera de aprobacion/);
    });
  });

  it("get_listing_details: should return complete technical sheet with deposit breakdown, amenities, rules, and availability", async () => {
    const mockListing: AccommodationListingItem = {
      id: "listing-detail-1",
      title: "Coliving Chamberi Premium",
      description: "Piso amplio y reformado en Chamberi.",
      pricePerMonth: 600,
      securityDeposit: 600,
      rentalType: "ROOM",
      status: "AVAILABLE",
      createdAt: "2026-09-01T12:00:00Z",
      hostId: "host-uuid-99",
      hostNickname: "maria_host",
      isPromoted: true,
      accommodation: {
        id: "acc-uuid-1",
        address: "Calle de Fuencarral 120",
        city: "Madrid",
        country: "Espana",
        province: "Madrid",
        totalRooms: 5,
        totalBathrooms: 2,
        freeRooms: 2,
        squareMeters: 140,
        amenities: ["WIFI", "HEATING", "ELEVATOR", "PETS_ALLOWED"]
      }
    };

    const mockListingClient: IListingClient = {
      searchCatalog: async () => ({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 }),
      getListingById: async (id: string) => {
        if (id === "listing-detail-1") return mockListing;
        return {} as AccommodationListingItem;
      }
    };

    const handler = new GetListingDetailsHandler(mockListingClient);
    const result = await handler.execute({ listingId: "listing-detail-1" });

    assert.equal(result.isError, undefined);
    const text = extractText(result.content[0]);
    const data = JSON.parse(text);

    assert.equal(data.anuncio.id, "listing-detail-1");
    assert.equal(data.anuncio.titulo, "Coliving Chamberi Premium");
    assert.equal(data.desgloseEconomico.precioMensual, "600 EUR");
    assert.equal(data.desgloseEconomico.fianzaDeposito, "600 EUR");
    assert.match(data.desgloseEconomico.totalPrimerMesEstimado, /1200 EUR/);
    assert.equal(data.habitabilidadYDisponibilidad.ratioDisponibilidad, "2 de 5 disponibles");
    assert.equal(data.habitabilidadYDisponibilidad.banosTotales, 2);
    assert.equal(data.habitabilidadYDisponibilidad.superficieM2, "140 m²");
    assert.deepEqual(data.serviciosIncluidos, ["WIFI", "HEATING", "ELEVATOR"]);
    assert.match(data.normasDeConvivencia.mascotasPermitidas, /PERMITIDO/);
    assert.match(data.normasDeConvivencia.tabacoPermitido, /NO PERMITIDO/);
    assert.equal(data.anfitrion.nickname, "maria_host");
  });

  it("get_listing_details: should reject empty listingId with InvalidArgumentError", async () => {
    const mockListingClient: IListingClient = {
      searchCatalog: async () => ({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 }),
      getListingById: async () => ({} as AccommodationListingItem)
    };

    const handler = new GetListingDetailsHandler(mockListingClient);
    await assert.rejects(
      async () => handler.execute({ listingId: "   " }),
      /Invalid listing arguments/
    );
  });

  it("get_listing_details: should return friendly message when listing not found", async () => {
    const mockListingClient: IListingClient = {
      searchCatalog: async () => ({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 }),
      getListingById: async () => ({} as AccommodationListingItem)
    };

    const handler = new GetListingDetailsHandler(mockListingClient);
    const result = await handler.execute({ listingId: "non-existent-listing" });
    const text = extractText(result.content[0]);
    assert.match(text, /No se encontro el anuncio de alojamiento con ID: non-existent-listing/);
  });

  it("get_listing_details: should return friendly message when client throws BackendIntegrationError with status 404 (BUG-02)", async () => {
    const mockListingClient: IListingClient = {
      searchCatalog: async () => ({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 }),
      getListingById: async (id: string) => {
        throw new BackendIntegrationError(`/listings/${id}`, "Listing not found in database", 404);
      }
    };

    const handler = new GetListingDetailsHandler(mockListingClient);
    const result = await handler.execute({ listingId: "listing-404-uuid" });
    assert.equal(result.isError, undefined);
    const text = extractText(result.content[0]);
    assert.match(text, /No se encontro el anuncio de alojamiento con ID: listing-404-uuid/);
  });
});
