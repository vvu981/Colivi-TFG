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

    // F-11: Verificar expiracion ANTES de eliminar el ticket.
    // Esto evita que tickets expirados sean marcados como "consumidos de un solo uso"
    // antes de ser validados, impidiendo cualquier reintento de diagnostico.
    if (Date.now() > entry.expiresAt) {
      this.tickets.delete(ticketId);
      return undefined;
    }

    // Ticket valido: consumir (un solo uso)
    this.tickets.delete(ticketId);
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
