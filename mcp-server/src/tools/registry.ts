import { Tool as McpToolDefinition, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { IMcpToolHandler } from "./types.js";
import { SearchColivingListingsHandler } from "./handlers/searchColivingListingsHandler.js";
import { GetUserChoresStatusHandler } from "./handlers/getUserChoresStatusHandler.js";
import { SummarizeHostInboxHandler } from "./handlers/summarizeHostInboxHandler.js";
import { GetModerationQueueHandler } from "./handlers/getModerationQueueHandler.js";
import { InvalidArgumentError } from "../core/errors/mcpError.js";
import { UserRole } from "../core/security/securityContext.js";
import { IListingClient } from "../clients/listingClient.js";
import { IHomeChoreClient } from "../clients/homeChoreClient.js";
import { IMessagingClient } from "../clients/messagingClient.js";
import { IReportClient } from "../clients/reportClient.js";

export interface IToolRegistry {
  register(handler: IMcpToolHandler): void;
  getHandler(name: string): IMcpToolHandler | undefined;
  getAllDefinitions(): McpToolDefinition[];
  getDefinitionsForRole(role?: UserRole): McpToolDefinition[];
  executeTool(name: string, args: unknown): Promise<CallToolResult>;
}

export class ToolRegistry implements IToolRegistry {
  private readonly handlers = new Map<string, IMcpToolHandler>();

  public register(handler: IMcpToolHandler): void {
    this.handlers.set(handler.definition.name, handler);
  }

  public getHandler(name: string): IMcpToolHandler | undefined {
    return this.handlers.get(name);
  }

  public getAllDefinitions(): McpToolDefinition[] {
    return Array.from(this.handlers.values()).map((h) => h.definition);
  }

  public getDefinitionsForRole(role?: UserRole): McpToolDefinition[] {
    return Array.from(this.handlers.values())
      .filter((h) => {
        if (!h.requiredRole) return true;
        if (role === "ADMIN") return true;
        return h.requiredRole === role;
      })
      .map((h) => h.definition);
  }

  public async executeTool(name: string, args: unknown): Promise<CallToolResult> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new InvalidArgumentError(`Tool [${name}] is not registered on this MCP server`);
    }

    return handler.execute(args);
  }
}

export interface DefaultToolRegistryOptions {
  listingClient?: IListingClient;
  homeChoreClient?: IHomeChoreClient;
  messagingClient?: IMessagingClient;
  reportClient?: IReportClient;
}

export function createDefaultToolRegistry(options?: DefaultToolRegistryOptions): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(new SearchColivingListingsHandler(options?.listingClient));
  registry.register(new GetUserChoresStatusHandler(options?.homeChoreClient));
  registry.register(new SummarizeHostInboxHandler(options?.messagingClient));
  registry.register(new GetModerationQueueHandler(options?.reportClient));

  return registry;
}
