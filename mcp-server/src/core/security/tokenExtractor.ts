import { Request } from "express";

export interface ITokenExtractor {
  extractToken(req: Request): string | undefined;
}

export class TokenExtractor implements ITokenExtractor {
  /**
   * Extrae el token JWT exclusivamente desde la cabecera estándar 'Authorization: Bearer <token>'
   * para prevenir fugas de credenciales en query parameters o URLs en logs de acceso (SEC-03 / CWE-598).
   */
  public extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === "string") {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }

    return undefined;
  }
}

export const defaultTokenExtractor = new TokenExtractor();
