import { ForbiddenError } from "../errors/mcpError.js";
import { SecurityContextHolder, SecurityContext } from "./securityContext.js";

export interface IAuthorizationGuard {
  assertAdmin(context?: SecurityContext): SecurityContext;
  assertAuthenticated(context?: SecurityContext): SecurityContext;
}

export class AuthorizationGuard implements IAuthorizationGuard {
  public assertAdmin(context?: SecurityContext): SecurityContext {
    const activeContext = context ?? SecurityContextHolder.getContext();
    if (activeContext.role !== "ADMIN") {
      throw new ForbiddenError(
        `Operation requires ADMIN role. Current user [${activeContext.userId}] has role [${activeContext.role}]`
      );
    }
    return activeContext;
  }

  public assertAuthenticated(context?: SecurityContext): SecurityContext {
    return context ?? SecurityContextHolder.getContext();
  }

  /**
   * Métodos estáticos de conveniencia delegados a la instancia por defecto (retrocompatibilidad).
   */
  public static assertAdmin(context?: SecurityContext): SecurityContext {
    return defaultAuthorizationGuard.assertAdmin(context);
  }

  public static assertAuthenticated(context?: SecurityContext): SecurityContext {
    return defaultAuthorizationGuard.assertAuthenticated(context);
  }
}

export const defaultAuthorizationGuard = new AuthorizationGuard();
