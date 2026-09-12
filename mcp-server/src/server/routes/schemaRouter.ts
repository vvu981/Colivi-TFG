import { Router, Request, Response } from "express";
import { IToolRegistry } from "../../tools/registry.js";
import { ITokenExtractor, defaultTokenExtractor } from "../../core/security/tokenExtractor.js";
import { IJwtVerifier, defaultJwtVerifier } from "../../core/security/jwtVerifier.js";
import { UserRole } from "../../core/security/securityContext.js";

export interface SchemaRouterDependencies {
  readonly toolRegistry: IToolRegistry;
  readonly tokenExtractor?: ITokenExtractor;
  readonly jwtVerifier?: IJwtVerifier;
}

export function createSchemaRouter(deps: IToolRegistry | SchemaRouterDependencies): Router {
  const router = Router();
  const toolRegistry = "toolRegistry" in deps ? deps.toolRegistry : deps;
  const tokenExtractor = "tokenExtractor" in deps && deps.tokenExtractor ? deps.tokenExtractor : defaultTokenExtractor;
  const jwtVerifier = "jwtVerifier" in deps && deps.jwtVerifier ? deps.jwtVerifier : defaultJwtVerifier;

  router.get("/", (req: Request, res: Response) => {
    const rawToken = tokenExtractor.extractToken(req);
    let role: UserRole | undefined = undefined;

    if (rawToken) {
      try {
        const context = jwtVerifier.verifyToken(rawToken);
        role = context.role;
      } catch {
        // Token inválido, se trata como anónimo
      }
    }

    res.status(200).json({
      name: "colivi-mcp-server",
      version: "1.0.0",
      description: "Herramientas de contexto de modelo (MCP) para Colivi",
      tools: toolRegistry.getDefinitionsForRole(role)
    });
  });

  return router;
}
