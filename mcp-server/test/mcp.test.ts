import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ToolErrorFormatter, defaultToolErrorFormatter } from "../src/mcp/toolErrorFormatter.js";
import { McpServerFactory } from "../src/mcp/mcpServerFactory.js";
import { createDefaultToolRegistry } from "../src/tools/registry.js";
import {
  McpError,
  UnauthorizedError,
  ForbiddenError,
  BackendIntegrationError,
  InvalidArgumentError
} from "../src/core/errors/mcpError.js";

describe("MCP Server Factory & Error Formatter Suite", () => {
  describe("ToolErrorFormatter", () => {
    it("should instantiate default formatter singleton", () => {
      assert.ok(defaultToolErrorFormatter);
      assert.ok(defaultToolErrorFormatter instanceof ToolErrorFormatter);
    });

    it("should format McpError instances with status code and message", () => {
      const formatter = new ToolErrorFormatter();
      const mcpErr = new UnauthorizedError("Invalid token passed");
      const result = formatter.formatError(mcpErr);

      assert.equal(result.isError, true);
      assert.equal(result.content.length, 1);
      assert.equal(result.content[0].type, "text");
      assert.equal((result.content[0] as { type: "text"; text: string }).text, "[MCP Error 401]: Invalid token passed");
    });

    it("should format generic Error instances with [Internal Error]", () => {
      const formatter = new ToolErrorFormatter();
      const standardErr = new Error("Database timeout");
      const result = formatter.formatError(standardErr);

      assert.equal(result.isError, true);
      assert.equal(result.content.length, 1);
      assert.equal((result.content[0] as { type: "text"; text: string }).text, "[Internal Error]: Database timeout");
    });

    it("should format unknown non-Error objects with fallback message", () => {
      const formatter = new ToolErrorFormatter();
      const result = formatter.formatError("Something weird happened");

      assert.equal(result.isError, true);
      assert.equal(result.content.length, 1);
      assert.equal((result.content[0] as { type: "text"; text: string }).text, "[Internal Error]: Internal unexpected error");
    });
  });

  describe("McpServerFactory", () => {
    it("should create server instance with custom name, version and tool handlers", async () => {
      const registry = createDefaultToolRegistry();
      const factory = new McpServerFactory({
        serverName: "custom-test-server",
        serverVersion: "2.0.0",
        toolRegistry: registry
      });

      const server = factory.createServer("ADMIN");
      assert.ok(server);

      // Verify ListTools handler execution with valid JSONRPC request object
      const listHandler = (server as any)._requestHandlers.get("tools/list");
      assert.ok(listHandler, "tools/list handler should be registered");
      const listResult = await listHandler({
        method: "tools/list",
        params: {}
      });
      assert.equal(listResult.tools.length, 4);

      // Verify CallTool handler execution error formatting
      const callHandler = (server as any)._requestHandlers.get("tools/call");
      assert.ok(callHandler, "tools/call handler should be registered");

      const callErrorResult = await callHandler({
        method: "tools/call",
        params: {
          name: "non_existent_tool",
          arguments: {}
        }
      });
      assert.equal(callErrorResult.isError, true);
    });

    it("should create server instance with default name and version", async () => {
      const registry = createDefaultToolRegistry();
      const factory = new McpServerFactory({
        toolRegistry: registry
      });

      const server = factory.createServer("USER");
      assert.ok(server);

      const listHandler = (server as any)._requestHandlers.get("tools/list");
      const listResult = await listHandler({
        method: "tools/list",
        params: {}
      });
      assert.equal(listResult.tools.length, 3);
    });
  });

  describe("McpError domain hierarchy", () => {
    it("should verify error codes and prototypes across all error types", () => {
      const baseErr = new McpError("Base fail", 500, -32603);
      assert.equal(baseErr.statusCode, 500);
      assert.equal(baseErr.code, -32603);
      assert.equal(baseErr.name, "McpError");

      const authErr = new UnauthorizedError();
      assert.equal(authErr.statusCode, 401);
      assert.equal(authErr.code, -32001);
      assert.equal(authErr.name, "UnauthorizedError");

      const forbErr = new ForbiddenError();
      assert.equal(forbErr.statusCode, 403);
      assert.equal(forbErr.code, -32003);
      assert.equal(forbErr.name, "ForbiddenError");

      const backendErr = new BackendIntegrationError("listings", "timeout", 504);
      assert.equal(backendErr.statusCode, 504);
      assert.equal(backendErr.code, -32002);
      assert.equal(backendErr.name, "BackendIntegrationError");

      const argErr = new InvalidArgumentError("Missing required parameter");
      assert.equal(argErr.statusCode, 400);
      assert.equal(argErr.code, -32602);
      assert.equal(argErr.name, "InvalidArgumentError");
    });
  });
});
