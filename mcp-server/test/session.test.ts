import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { McpSessionManager } from "../src/session/sessionManager.js";
import { SessionNotFoundError } from "../src/core/errors/mcpError.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SecurityContext } from "../src/core/security/securityContext.js";

describe("McpSessionManager Suite", () => {
  const createMockSession = (sessionId: string) => {
    let closed = false;
    const mockServer = {
      close: async () => {
        closed = true;
      }
    } as unknown as Server;

    const mockTransport = {
      sessionId
    } as unknown as SSEServerTransport;

    const mockContext: SecurityContext = {
      userId: `user-${sessionId}`,
      email: `${sessionId}@colivi.com`,
      role: "USER",
      token: "dummy"
    };

    return {
      sessionParams: {
        sessionId,
        transport: mockTransport,
        server: mockServer,
        securityContext: mockContext
      },
      isClosed: () => closed
    };
  };

  it("should register and retrieve a session correctly", () => {
    const manager = new McpSessionManager();
    const { sessionParams } = createMockSession("sess-1");

    const session = manager.registerSession(sessionParams);
    assert.equal(session.sessionId, "sess-1");
    assert.equal(manager.count(), 1);
    assert.equal(manager.hasSession("sess-1"), true);

    const retrieved = manager.getSession("sess-1");
    assert.equal(retrieved.sessionId, "sess-1");
    assert.equal(retrieved.securityContext.email, "sess-1@colivi.com");
  });

  it("should throw SessionNotFoundError when session does not exist", () => {
    const manager = new McpSessionManager();
    assert.throws(
      () => manager.getSession("non-existent"),
      (err: unknown) => err instanceof SessionNotFoundError
    );
  });

  it("should close a session and execute server.close()", async () => {
    const manager = new McpSessionManager();
    const { sessionParams, isClosed } = createMockSession("sess-2");

    manager.registerSession(sessionParams);
    assert.equal(manager.count(), 1);

    const closed = await manager.closeSession("sess-2");
    assert.equal(closed, true);
    assert.equal(manager.count(), 0);
    assert.equal(manager.hasSession("sess-2"), false);
    assert.equal(isClosed(), true);
  });

  it("should close all sessions cleanly on closeAll()", async () => {
    const manager = new McpSessionManager();
    const mock1 = createMockSession("sess-a");
    const mock2 = createMockSession("sess-b");

    manager.registerSession(mock1.sessionParams);
    manager.registerSession(mock2.sessionParams);
    assert.equal(manager.count(), 2);

    await manager.closeAll();
    assert.equal(manager.count(), 0);
    assert.equal(mock1.isClosed(), true);
    assert.equal(mock2.isClosed(), true);
  });

  it("should cleanup stale sessions based on lastActivityAt", async () => {
    const manager = new McpSessionManager();
    const mockStale = createMockSession("sess-stale");
    const mockActive = createMockSession("sess-active");

    const staleSession = manager.registerSession(mockStale.sessionParams);
    manager.registerSession(mockActive.sessionParams);

    // Simular inactividad en staleSession
    staleSession.lastActivityAt = new Date(Date.now() - 5000);

    const cleaned = await manager.cleanupStaleSessions(3000);
    assert.equal(cleaned, 1);
    assert.equal(manager.count(), 1);
    assert.equal(manager.hasSession("sess-stale"), false);
    assert.equal(manager.hasSession("sess-active"), true);
    assert.equal(mockStale.isClosed(), true);
  });
});
