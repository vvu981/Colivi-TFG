import crypto from "node:crypto";
import { SecurityContext } from "./securityContext.js";

interface TicketEntry {
  readonly context: SecurityContext;
  readonly expiresAt: number;
}

export interface ITicketManager {
  createTicket(context: SecurityContext, ttlMs?: number): string;
  consumeTicket(ticketId: string): SecurityContext | undefined;
}

export class TicketManager implements ITicketManager {
  private readonly tickets = new Map<string, TicketEntry>();

  public createTicket(context: SecurityContext, ttlMs: number = 30000): string {
    this.cleanExpired();
    const ticketId = crypto.randomUUID();
    this.tickets.set(ticketId, {
      context,
      expiresAt: Date.now() + ttlMs
    });
    return ticketId;
  }

  public consumeTicket(ticketId: string): SecurityContext | undefined {
    this.cleanExpired();
    const entry = this.tickets.get(ticketId);
    if (!entry) {
      return undefined;
    }

    // Un solo uso (single-use)
    this.tickets.delete(ticketId);

    if (Date.now() > entry.expiresAt) {
      return undefined;
    }

    return entry.context;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.tickets.entries()) {
      if (now > entry.expiresAt) {
        this.tickets.delete(id);
      }
    }
  }
}

export const defaultTicketManager = new TicketManager();
