import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpError } from "../core/errors/mcpError.js";

export interface IToolErrorFormatter {
  formatError(error: unknown): CallToolResult;
}

export class ToolErrorFormatter implements IToolErrorFormatter {
  public formatError(error: unknown): CallToolResult {
    if (error instanceof McpError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `[MCP Error ${error.statusCode}]: ${error.message}`
          }
        ],
        isError: true
      };
    }

    const message = error instanceof Error ? error.message : "Internal unexpected error";
    return {
      content: [
        {
          type: "text" as const,
          text: `[Internal Error]: ${message}`
        }
      ],
      isError: true
    };
  }
}

export const defaultToolErrorFormatter = new ToolErrorFormatter();
