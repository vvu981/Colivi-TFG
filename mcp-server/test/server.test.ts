import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Server as HttpServer } from "node:http";
import { createApp } from "../src/server/app.js";
import { McpSessionManager } from "../src/session/sessionManager.js";
import { createDefaultToolRegistry } from "../src/tools/registry.js";
import { McpServerFactory } from "../src/mcp/mcpServerFactory.js";

describe("MCP Express Server & Routing Suite", () => {
  let server: HttpServer;
  let baseUrl: string;
  let sessionManager: McpSessionManager;

  before(async () => {
    const toolRegistry = createDefaultToolRegistry();
    const serverFactory = new McpServerFactory({ toolRegistry });
    sessionManager = new McpSessionManager();

    const app = createApp({
      sessionManager,
      toolRegistry,
      serverFactory
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await sessionManager.closeAll();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /health should return 200 with status UP and session metrics", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as { status: string; service: string; activeSessions: number };
    assert.equal(body.status, "UP");
    assert.equal(body.service, "colivi-mcp-server");
    assert.equal(body.activeSessions, 0);
  });

  it("GET /schema should return 200 with all tool definitions", async () => {
    const res = await fetch(`${baseUrl}/schema`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as { name: string; tools: unknown[] };
    assert.equal(body.name, "colivi-mcp-server");
    assert.equal(body.tools.length, 4);
  });

  it("GET /sse without token should return 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/sse`);
    assert.equal(res.status, 401);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "UNAUTHORIZED");
  });

  it("POST /messages without sessionId should return 400 INVALID_ARGUMENT", async () => {
    const res = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "INVALID_ARGUMENT");
  });

  it("POST /messages with unknown sessionId should return 404 SESSION_NOT_FOUND", async () => {
    const res = await fetch(`${baseUrl}/messages?sessionId=invalid-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 404);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "SESSION_NOT_FOUND");
  });
});
