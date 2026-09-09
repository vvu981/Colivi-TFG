import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HomeChoreClient, homeChoreClient } from "../src/clients/homeChoreClient.js";
import { ListingClient, listingClient } from "../src/clients/listingClient.js";
import { MessagingClient, messagingClient } from "../src/clients/messagingClient.js";
import { ReportClient, reportClient } from "../src/clients/reportClient.js";
import { IHttpClient } from "../src/core/http/types.js";

describe("Clients Test Suite", () => {
  describe("HomeChoreClient", () => {
    it("should instantiate default singleton", () => {
      assert.ok(homeChoreClient);
      assert.ok(homeChoreClient instanceof HomeChoreClient);
    });

    it("should call getUserHomes with default and custom status", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return [] as unknown as T;
        }
      };

      const client = new HomeChoreClient(mockHttp);
      await client.getUserHomes();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/homes");
      assert.deepEqual(calls[0].params, { status: "ACTIVE" });

      await client.getUserHomes("INACTIVE");
      assert.equal(calls.length, 2);
      assert.deepEqual(calls[1].params, { status: "INACTIVE" });
    });

    it("should call getPendingChores with correct parameters", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return [] as unknown as T;
        }
      };

      const client = new HomeChoreClient(mockHttp);
      await client.getPendingChores("home-123", "user-456");
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/homes/home-123/chores");
      assert.deepEqual(calls[0].params, { assigneeId: "user-456", status: "PENDING" });
    });

    it("should call getLeaderboard with and without period", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { period: "MONTHLY", scores: [] } as unknown as T;
        }
      };

      const client = new HomeChoreClient(mockHttp);
      await client.getLeaderboard("home-999");
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/homes/home-999/chores/leaderboard");
      assert.deepEqual(calls[0].params, { period: "WEEKLY" });

      await client.getLeaderboard("home-999", "MONTHLY");
      assert.equal(calls.length, 2);
      assert.deepEqual(calls[1].params, { period: "MONTHLY" });
    });
  });

  describe("ListingClient", () => {
    it("should instantiate default singleton", () => {
      assert.ok(listingClient);
      assert.ok(listingClient instanceof ListingClient);
    });

    it("should search catalog with minimal params and default pagination", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 } as unknown as T;
        }
      };

      const client = new ListingClient(mockHttp);
      await client.searchCatalog({ city: "Madrid" });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/listings");
      assert.deepEqual(calls[0].params, { city: "Madrid", page: 0, size: 20 });
    });

    it("should search catalog with optional maxPrice and rentalType", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 1 } as unknown as T;
        }
      };

      const client = new ListingClient(mockHttp);
      await client.searchCatalog({
        city: "Barcelona",
        maxPrice: 650,
        rentalType: "ROOM",
        page: 1,
        size: 10
      });

      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].params, {
        city: "Barcelona",
        maxPrice: 650,
        rentalType: "ROOM",
        page: 1,
        size: 10
      });
    });
  });

  describe("MessagingClient", () => {
    it("should instantiate default singleton", () => {
      assert.ok(messagingClient);
      assert.ok(messagingClient instanceof MessagingClient);
    });

    it("should fetch inbox with default parameters", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 50, number: 0 } as unknown as T;
        }
      };

      const client = new MessagingClient(mockHttp);
      await client.getInbox();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/conversations");
      assert.deepEqual(calls[0].params, { archived: false, page: 0, size: 50 });
    });

    it("should fetch inbox with custom archived filter and pagination", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 15, number: 2 } as unknown as T;
        }
      };

      const client = new MessagingClient(mockHttp);
      await client.getInbox({ archived: true, page: 2, size: 15 });
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].params, { archived: true, page: 2, size: 15 });
    });
  });

  describe("ReportClient", () => {
    it("should instantiate default singleton", () => {
      assert.ok(reportClient);
      assert.ok(reportClient instanceof ReportClient);
    });

    it("should fetch most reported items with default pagination", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 } as unknown as T;
        }
      };

      const client = new ReportClient(mockHttp);
      await client.getMostReported({ targetType: "USER" });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/admin/reports/most-reported");
      assert.deepEqual(calls[0].params, { type: "USER", page: 0, size: 10 });
    });

    it("should fetch most reported items with custom pagination", async () => {
      const calls: { path: string; params?: Record<string, unknown> }[] = [];
      const mockHttp: IHttpClient = {
        async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
          calls.push({ path, params: queryParams });
          return { content: [], totalElements: 0, totalPages: 0, size: 5, number: 3 } as unknown as T;
        }
      };

      const client = new ReportClient(mockHttp);
      await client.getMostReported({ targetType: "LISTING", page: 3, size: 5 });
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].params, { type: "LISTING", page: 3, size: 5 });
    });
  });
});
