import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/mcpError.js";
import { SecurityContext, UserRole } from "./securityContext.js";

export interface IJwtVerifier {
  verifyToken(rawToken: string): SecurityContext;
}

interface JwtPayloadClaims extends jwt.JwtPayload {
  id?: string;
  role?: string;
  sub?: string;
}

export class JwtVerifier implements IJwtVerifier {
  private readonly secretBuffer: Buffer;

  constructor(secretBase64: string = env.JWT_SECRET) {
    this.secretBuffer = Buffer.from(secretBase64, "base64");
  }

  public verifyToken(rawToken: string): SecurityContext {
    if (!rawToken || typeof rawToken !== "string") {
      throw new UnauthorizedError("Bearer token is missing or empty");
    }

    const cleanToken = rawToken.replace(/^Bearer\s+/i, "").trim();

    try {
      const decoded = jwt.verify(cleanToken, this.secretBuffer, {
        algorithms: ["HS256", "HS384", "HS512"]
      }) as JwtPayloadClaims;

      if (!decoded.id || !decoded.role || !decoded.sub) {
        throw new UnauthorizedError("JWT payload is missing mandatory claims (id, role, sub)");
      }

      const roleStr = decoded.role.toUpperCase();
      if (roleStr !== "USER" && roleStr !== "ADMIN") {
        throw new UnauthorizedError(`Invalid user role in token: ${decoded.role}`);
      }

      return {
        userId: decoded.id,
        email: decoded.sub,
        role: roleStr as UserRole,
        token: cleanToken
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Token verification failed";
      throw new UnauthorizedError(`Invalid JWT token: ${message}`);
    }
  }

  /**
   * Método estático de conveniencia delegado a la instancia por defecto (retrocompatibilidad).
   */
  public static verifyToken(rawToken: string): SecurityContext {
    return defaultJwtVerifier.verifyToken(rawToken);
  }
}

export const defaultJwtVerifier = new JwtVerifier();
