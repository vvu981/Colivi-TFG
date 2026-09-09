import { Request } from "express";

export interface ITokenExtractor {
  extractToken(req: Request): string | undefined;
}

export class TokenExtractor implements ITokenExtractor {
  /**
   * Extrae el token JWT con orden de precedencia estricto:
   * 1. Cabecera Authorization: Bearer <token>
   * 2. Query param: ?token=<token>
   * 3. Route param: /token/:token/... o /:token/...
   */
  public extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === "string") {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }

    const queryToken = req.query.token;
    if (queryToken && typeof queryToken === "string" && queryToken.trim()) {
      return queryToken.trim();
    }

    const paramToken = req.params.token;
    if (paramToken && typeof paramToken === "string" && paramToken.trim()) {
      return paramToken.trim();
    }

    return undefined;
  }
}

export const defaultTokenExtractor = new TokenExtractor();
