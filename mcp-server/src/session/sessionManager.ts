import crypto from "node:crypto";
import { ISessionManager, McpSession } from "./types.js";
import { SessionNotFoundError } from "../core/errors/mcpError.js";

export class McpSessionManager implements ISessionManager {
  private readonly sessions = new Map<string, McpSession>();

  public registerSession(
    params: Omit<McpSession, "createdAt" | "lastActivityAt" | "sessionSecret"> & {
      sessionSecret?: string;
    }
  ): McpSession {
    const now = new Date();
    const session: McpSession = {
      ...params,
      sessionSecret: params.sessionSecret ?? crypto.randomUUID(),
      createdAt: now,
      lastActivityAt: now
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  public getSession(sessionId: string): McpSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  public touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
  }

  public async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);

    try {
      await session.server.close();
    } catch {
      // Ignorar fallos controlados al cerrar el server de la sesión
    }

    return true;
  }

  public async closeAll(): Promise<void> {
    const sessionList = Array.from(this.sessions.values());
    this.sessions.clear();

    await Promise.allSettled(
      sessionList.map(async (session) => {
        try {
          await session.server.close();
        } catch {
          // Ignorar fallos individuales en apagado masivo
        }
      })
    );
  }

  public count(): number {
    return this.sessions.size;
  }

  public getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  public async cleanupStaleSessions(maxAgeMs: number): Promise<number> {
    const now = Date.now();
    let closedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt.getTime() > maxAgeMs) {
        await this.closeSession(sessionId);
        closedCount++;
      }
    }

    return closedCount;
  }
}

export const defaultSessionManager = new McpSessionManager();
