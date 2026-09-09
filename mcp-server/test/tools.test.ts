import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createDefaultToolRegistry } from "../src/tools/registry.js";
import { ALL_MCP_TOOLS } from "../src/schemas/toolSchemas.js";
import { SearchColivingListingsHandler } from "../src/tools/handlers/searchColivingListingsHandler.js";
import { GetModerationQueueHandler } from "../src/tools/handlers/getModerationQueueHandler.js";
import { GetUserChoresStatusHandler } from "../src/tools/handlers/getUserChoresStatusHandler.js";
import { SummarizeHostInboxHandler } from "../src/tools/handlers/summarizeHostInboxHandler.js";
import { SecurityContextHolder } from "../src/core/security/securityContext.js";
import { ForbiddenError } from "../src/core/errors/mcpError.js";
import { IListingClient, PageResponse, AccommodationListingItem } from "../src/clients/listingClient.js";
import { IReportClient, ReportTargetCount } from "../src/clients/reportClient.js";
import { IHomeChoreClient, HomeSummary, ChoreItem, ChoreLeaderboard } from "../src/clients/homeChoreClient.js";
import { IMessagingClient, ConversationSummary } from "../src/clients/messagingClient.js";

function extractText(content: CallToolResult["content"][number] | undefined): string {
  assert.ok(content && content.type === "text", "Expected content block to be of type 'text'");
  return content.text;
}

describe("MCP Tools & Handlers Suite", () => {
  it("should have exactly the 4 required tools registered in schema and registry", () => {
    const registry = createDefaultToolRegistry();
    const definitions = registry.getAllDefinitions();

    assert.equal(definitions.length, 4);
    assert.equal(ALL_MCP_TOOLS.length, 4);

    const names = definitions.map((d) => d.name).sort();
    const expected = [
      "get_moderation_queue",
      "get_user_chores_status",
      "search_coliving_listings",
      "summarize_host_inbox"
    ].sort();

    assert.deepEqual(names, expected);
  });

  it("should filter tools by role: USER sees only 3 tools, ADMIN sees all 4", () => {
    const registry = createDefaultToolRegistry();

    const userTools = registry.getDefinitionsForRole("USER");
    assert.equal(userTools.length, 3);
    const userToolNames = userTools.map((t) => t.name);
    assert.ok(!userToolNames.includes("get_moderation_queue"), "USER should not see get_moderation_queue");
    assert.ok(userToolNames.includes("search_coliving_listings"));
    assert.ok(userToolNames.includes("get_user_chores_status"));
    assert.ok(userToolNames.includes("summarize_host_inbox"));

    const adminTools = registry.getDefinitionsForRole("ADMIN");
    assert.equal(adminTools.length, 4);
    const adminToolNames = adminTools.map((t) => t.name);
    assert.ok(adminToolNames.includes("get_moderation_queue"));
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
      searchCatalog: async () => mockListings
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
      })
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
});
