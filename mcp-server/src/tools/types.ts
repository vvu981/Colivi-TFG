import { Tool as McpToolDefinition, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { UserRole } from "../core/security/securityContext.js";

export type ToolExecutionResult = CallToolResult;

export interface IMcpToolHandler<TInput = unknown> {
  readonly definition: McpToolDefinition;
  readonly requiredRole?: UserRole;
  execute(args: TInput): Promise<CallToolResult>;
}
