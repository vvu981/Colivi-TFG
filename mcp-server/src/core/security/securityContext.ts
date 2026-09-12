import { AsyncLocalStorage } from "node:async_hooks";
import { UnauthorizedError } from "../errors/mcpError.js";

export type UserRole = "USER" | "ADMIN";

export interface SecurityContext {
  userId: string;
  email: string;
  role: UserRole;
  token: string;
}

class SecurityContextStorage {
  private readonly storage = new AsyncLocalStorage<SecurityContext>();

  public run<T>(context: SecurityContext, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(context, fn);
  }

  public getContext(): SecurityContext {
    const context = this.storage.getStore();
    if (!context) {
      throw new UnauthorizedError("No security context available in current execution scope");
    }
    return context;
  }

  public tryGetContext(): SecurityContext | undefined {
    return this.storage.getStore();
  }
}

export const SecurityContextHolder = new SecurityContextStorage();
