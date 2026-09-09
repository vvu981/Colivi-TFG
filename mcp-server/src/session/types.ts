import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SecurityContext } from "../core/security/securityContext.js";

export interface McpSession {
  readonly sessionId: string;
  readonly transport: SSEServerTransport;
  readonly server: Server;
  readonly securityContext: SecurityContext;
  readonly createdAt: Date;
  lastActivityAt: Date;
}

export interface ISessionManager {
  registerSession(session: Omit<McpSession, "createdAt" | "lastActivityAt">): McpSession;
  getSession(sessionId: string): McpSession;
  hasSession(sessionId: string): boolean;
  touchSession(sessionId: string): void;
  closeSession(sessionId: string): Promise<boolean>;
  closeAll(): Promise<void>;
  count(): number;
  getAllSessionIds(): string[];
  cleanupStaleSessions(maxAgeMs: number): Promise<number>;
}
