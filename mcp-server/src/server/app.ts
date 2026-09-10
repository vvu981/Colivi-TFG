import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "../config/env.js";
import { ISessionManager } from "../session/types.js";
import { IToolRegistry } from "../tools/registry.js";
import { IMcpServerFactory } from "../mcp/types.js";
import { IJwtVerifier } from "../core/security/jwtVerifier.js";
import { ITokenExtractor } from "../core/security/tokenExtractor.js";
import { createHealthRouter } from "./routes/healthRouter.js";
import { createSchemaRouter } from "./routes/schemaRouter.js";
import { createMcpRouter } from "./routes/mcpRouter.js";

export interface AppDependencies {
  readonly sessionManager: ISessionManager;
  readonly toolRegistry: IToolRegistry;
  readonly serverFactory: IMcpServerFactory;
  readonly jwtVerifier?: IJwtVerifier;
  readonly tokenExtractor?: ITokenExtractor;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  // F-20: CORS restringido a origenes definidos en ALLOWED_ORIGINS (separados por coma).
  // Sin la variable, se bloquean todas las peticiones cross-origin.
  // Correcto para un servidor MCP interno accedido solo desde el backend Spring.
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
  app.use(
    cors(
      allowedOrigins && allowedOrigins.length > 0
        ? { origin: allowedOrigins, credentials: true }
        : { origin: false }
    )
  );

  app.use(express.json());

  // Rutas de diagnóstico y metadatos
  app.use("/health", createHealthRouter(deps.sessionManager));
  app.use(
    "/schema",
    createSchemaRouter({
      toolRegistry: deps.toolRegistry,
      tokenExtractor: deps.tokenExtractor,
      jwtVerifier: deps.jwtVerifier
    })
  );

  // Rutas del protocolo MCP (SSE y mensajes)
  app.use(
    createMcpRouter({
      sessionManager: deps.sessionManager,
      serverFactory: deps.serverFactory,
      jwtVerifier: deps.jwtVerifier,
      tokenExtractor: deps.tokenExtractor
    })
  );

  // Middleware global de manejo de excepciones
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Unhandled Server Error]:", err);
    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: err.message
    });
  });

  return app;
}
