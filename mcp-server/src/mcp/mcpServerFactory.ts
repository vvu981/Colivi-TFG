import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { IMcpServerFactory } from "./types.js";
import { ToolRegistry } from "../tools/registry.js";
import { IToolErrorFormatter, defaultToolErrorFormatter } from "./toolErrorFormatter.js";
import { UserRole } from "../core/security/securityContext.js";

export interface McpServerFactoryOptions {
  readonly serverName?: string;
  readonly serverVersion?: string;
  readonly toolRegistry: ToolRegistry;
  readonly errorFormatter?: IToolErrorFormatter;
}

export class McpServerFactory implements IMcpServerFactory {
  private readonly serverName: string;
  private readonly serverVersion: string;
  private readonly toolRegistry: ToolRegistry;
  private readonly errorFormatter: IToolErrorFormatter;

  constructor(options: McpServerFactoryOptions) {
    this.serverName = options.serverName ?? "colivi-mcp-server";
    this.serverVersion = options.serverVersion ?? "1.0.0";
    this.toolRegistry = options.toolRegistry;
    this.errorFormatter = options.errorFormatter ?? defaultToolErrorFormatter;
  }

  public createServer(role?: UserRole): Server {
    const server = new Server(
      {
        name: this.serverName,
        version: this.serverVersion
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Manejador del catálogo de herramientas (JSON-RPC: tools/list) filtrado por rol
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getDefinitionsForRole(role)
      };
    });

    // Manejador de invocación de herramientas (JSON-RPC: tools/call)
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: toolArgs } = request.params;
      try {
        return await this.toolRegistry.executeTool(name, toolArgs);
      } catch (error) {
        return this.errorFormatter.formatError(error);
      }
    });

    return server;
  }
}
