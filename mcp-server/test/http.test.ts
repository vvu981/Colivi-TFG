import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import axios, { AxiosError } from "axios";
import { ColiviHttpClient, httpClient } from "../src/core/http/coliviHttpClient.js";
import { SecurityContextHolder } from "../src/core/security/securityContext.js";
import {
  UnauthorizedError,
  ForbiddenError,
  BackendIntegrationError
} from "../src/core/errors/mcpError.js";

describe("ColiviHttpClient Suite", () => {
  it("should instantiate default singleton", () => {
    assert.ok(httpClient);
    assert.ok(httpClient instanceof ColiviHttpClient);
  });

  it("should successfully execute GET request and return data", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async (path: string, config?: { params?: Record<string, unknown> }) => {
      assert.equal(path, "/test-path");
      assert.deepEqual(config?.params, { key: "value" });
      return { data: { success: true } };
    });

    const result = await client.get<{ success: boolean }>("/test-path", { key: "value" });
    assert.deepEqual(result, { success: true });
  });

  it("should include Bearer token when SecurityContextHolder has active context", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: any }).client;

    await SecurityContextHolder.run({ userId: "u-1", email: "user@example.com", role: "USER", token: "secret-jwt-token" }, async () => {
      // Simulate interceptor execution
      const interceptor = internalAxios.interceptors.request.handlers[0];
      const initialConfig = { headers: {} as Record<string, string> };
      const modifiedConfig = await interceptor.fulfilled(initialConfig);

      assert.equal(modifiedConfig.headers.Authorization, "Bearer secret-jwt-token");
    });
  });

  it("should not add Authorization header when no security context is present", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: any }).client;

    const interceptor = internalAxios.interceptors.request.handlers[0];
    const initialConfig = { headers: {} as Record<string, string> };
    const modifiedConfig = await interceptor.fulfilled(initialConfig);

    assert.equal(modifiedConfig.headers.Authorization, undefined);
  });

  it("should throw UnauthorizedError when backend returns 401", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async () => {
      const err = new AxiosError("Unauthorized", "401");
      err.response = {
        status: 401,
        statusText: "Unauthorized",
        data: { message: "Token expired" },
        headers: {},
        config: {} as any
      };
      throw err;
    });

    await assert.rejects(
      async () => client.get("/secure-resource"),
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedError);
        assert.match((err as UnauthorizedError).message, /Token expired/);
        return true;
      }
    );
  });

  it("should throw ForbiddenError when backend returns 403", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async () => {
      const err = new AxiosError("Forbidden", "403");
      err.response = {
        status: 403,
        statusText: "Forbidden",
        data: { error: "Insufficient privileges" },
        headers: {},
        config: {} as any
      };
      throw err;
    });

    await assert.rejects(
      async () => client.get("/admin-resource"),
      (err: unknown) => {
        assert.ok(err instanceof ForbiddenError);
        assert.match((err as ForbiddenError).message, /Insufficient privileges/);
        return true;
      }
    );
  });

  it("should throw BackendIntegrationError with custom status when backend returns other 5xx/4xx", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async () => {
      const err = new AxiosError("Bad Gateway", "502");
      err.response = {
        status: 502,
        statusText: "Bad Gateway",
        data: { message: "Service unavailable upstream" },
        headers: {},
        config: {} as any
      };
      throw err;
    });

    await assert.rejects(
      async () => client.get("/external"),
      (err: unknown) => {
        assert.ok(err instanceof BackendIntegrationError);
        assert.equal((err as BackendIntegrationError).statusCode, 502);
        assert.match((err as BackendIntegrationError).message, /Service unavailable upstream/);
        return true;
      }
    );
  });

  it("should throw BackendIntegrationError 500 when non-Axios error is caught", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async () => {
      throw new Error("DNS resolution failure");
    });

    await assert.rejects(
      async () => client.get("/dns-fail"),
      (err: unknown) => {
        assert.ok(err instanceof BackendIntegrationError);
        assert.equal((err as BackendIntegrationError).statusCode, 500);
        assert.match((err as BackendIntegrationError).message, /DNS resolution failure/);
        return true;
      }
    );
  });

  it("should handle unknown non-Error objects gracefully", async () => {
    const client = new ColiviHttpClient("http://fake-backend:8080");
    const internalAxios = (client as unknown as { client: typeof axios }).client;

    mock.method(internalAxios, "get", async () => {
      throw "Raw string failure";
    });

    await assert.rejects(
      async () => client.get("/raw-fail"),
      (err: unknown) => {
        assert.ok(err instanceof BackendIntegrationError);
        assert.equal((err as BackendIntegrationError).statusCode, 500);
        assert.match((err as BackendIntegrationError).message, /Unknown HTTP error/);
        return true;
      }
    );
  });
});
