import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { JwtVerifier } from "../src/core/security/jwtVerifier.js";
import { AuthorizationGuard } from "../src/core/security/authorizationGuard.js";
import { SecurityContextHolder } from "../src/core/security/securityContext.js";
import { ForbiddenError, UnauthorizedError } from "../src/core/errors/mcpError.js";
import { env } from "../src/config/env.js";

describe("MCP Security Context & RBAC Suite", () => {
  const secretBuffer = Buffer.from(env.JWT_SECRET, "base64");

  const createTestToken = (payload: { id: string; role: string; sub: string }) => {
    return jwt.sign(payload, secretBuffer, { algorithm: "HS256", expiresIn: "1h" });
  };

  it("should successfully verify and extract context for a valid USER token", () => {
    const token = createTestToken({
      id: "550e8400-e29b-41d4-a716-446655440000",
      role: "USER",
      sub: "tenant@colivi.com"
    });

    const context = JwtVerifier.verifyToken(`Bearer ${token}`);
    assert.equal(context.userId, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(context.email, "tenant@colivi.com");
    assert.equal(context.role, "USER");
    assert.equal(context.token, token);
  });

  it("should reject an invalid or tampered token", () => {
    assert.throws(
      () => JwtVerifier.verifyToken("invalid.tampered.token"),
      (err: unknown) => err instanceof UnauthorizedError
    );
  });

  it("should enforce ADMIN guard and throw ForbiddenError for USER role", () => {
    const userContext = {
      userId: "11111111-1111-1111-1111-111111111111",
      email: "user@colivi.com",
      role: "USER" as const,
      token: "dummy"
    };

    assert.throws(
      () => AuthorizationGuard.assertAdmin(userContext),
      (err: unknown) => err instanceof ForbiddenError
    );
  });

  it("should allow ADMIN guard for ADMIN role", () => {
    const adminContext = {
      userId: "22222222-2222-2222-2222-222222222222",
      email: "admin@colivi.com",
      role: "ADMIN" as const,
      token: "dummy"
    };

    const result = AuthorizationGuard.assertAdmin(adminContext);
    assert.equal(result.role, "ADMIN");
  });

  it("should propagate context asynchronously via SecurityContextHolder", async () => {
    const context = {
      userId: "44444444-4444-4444-4444-444444444444",
      email: "async@colivi.com",
      role: "USER" as const,
      token: "token-xyz"
    };

    await SecurityContextHolder.run(context, async () => {
      const activeContext = SecurityContextHolder.getContext();
      assert.equal(activeContext.userId, context.userId);
      assert.equal(activeContext.email, context.email);
    });
  });

  it("should extract tokens using TokenExtractor respecting precedence", async () => {
    const { TokenExtractor } = await import("../src/core/security/tokenExtractor.js");
    const extractor = new TokenExtractor();

    // 1. Authorization header tiene máxima prioridad
    const reqHeader = {
      headers: { authorization: "Bearer header-token-123" },
      query: { token: "query-token" },
      params: { token: "param-token" }
    } as any;
    assert.equal(extractor.extractToken(reqHeader), "header-token-123");

    // 2. Query param si no hay cabecera
    const reqQuery = {
      headers: {},
      query: { token: "query-token-456" },
      params: { token: "param-token" }
    } as any;
    assert.equal(extractor.extractToken(reqQuery), "query-token-456");

    // 3. Param si no hay cabecera ni query
    const reqParam = {
      headers: {},
      query: {},
      params: { token: "param-token-789" }
    } as any;
    assert.equal(extractor.extractToken(reqParam), "param-token-789");

    // 4. Undefined si ninguno existe
    const reqEmpty = {
      headers: {},
      query: {},
      params: {}
    } as any;
    assert.equal(extractor.extractToken(reqEmpty), undefined);
  });
});
