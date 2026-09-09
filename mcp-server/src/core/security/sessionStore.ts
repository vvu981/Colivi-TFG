import { SecurityContext } from "./securityContext.js";
import { SessionNotFoundError } from "../errors/mcpError.js";

export interface ISecurityContextStore {
  registerSession(sessionId: string, context: SecurityContext): void;
  getSession(sessionId: string): SecurityContext;
  hasSession(sessionId: string): boolean;
  removeSession(sessionId: string): boolean;
  count(): number;
}

export class SessionStore implements ISecurityContextStore {
  private readonly sessions = new Map<string, SecurityContext>();

  public registerSession(sessionId: string, context: SecurityContext): void {
    this.sessions.set(sessionId, context);
  }

  public getSession(sessionId: string): SecurityContext {
    const context = this.sessions.get(sessionId);
    if (!context) {
      throw new SessionNotFoundError(sessionId);
    }
    return context;
  }

  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  public removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  public count(): number {
    return this.sessions.size;
  }

  /**
   * Métodos estáticos delegados a la instancia por defecto para preservar retrocompatibilidad.
   */
  public static registerSession(sessionId: string, context: SecurityContext): void {
    defaultSessionStore.registerSession(sessionId, context);
  }

  public static getSession(sessionId: string): SecurityContext {
    return defaultSessionStore.getSession(sessionId);
  }

  public static hasSession(sessionId: string): boolean {
    return defaultSessionStore.hasSession(sessionId);
  }

  public static removeSession(sessionId: string): boolean {
    return defaultSessionStore.removeSession(sessionId);
  }

  public static count(): number {
    return defaultSessionStore.count();
  }
}

export const defaultSessionStore = new SessionStore();
