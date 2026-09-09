import { Router, Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ISessionManager } from "../../session/types.js";
import { IMcpServerFactory } from "../../mcp/types.js";
import { IJwtVerifier, defaultJwtVerifier } from "../../core/security/jwtVerifier.js";
import { ITokenExtractor, defaultTokenExtractor } from "../../core/security/tokenExtractor.js";
import { SecurityContextHolder } from "../../core/security/securityContext.js";
import { UnauthorizedError, SessionNotFoundError } from "../../core/errors/mcpError.js";

export interface McpRouterDependencies {
  readonly sessionManager: ISessionManager;
  readonly serverFactory: IMcpServerFactory;
  readonly jwtVerifier?: IJwtVerifier;
  readonly tokenExtractor?: ITokenExtractor;
}

export function createMcpRouter(deps: McpRouterDependencies): Router {
  const router = Router();
  const jwtVerifier = deps.jwtVerifier ?? defaultJwtVerifier;
  const tokenExtractor = deps.tokenExtractor ?? defaultTokenExtractor;
  const sessionManager = deps.sessionManager;
  const serverFactory = deps.serverFactory;

  /**
   * Handshake SSE: Valida JWT y establece el canal de streaming unidireccional del servidor al cliente.
   */
  const ssePaths = ["/sse", "/token/:token/sse", "/:token/sse"];
  router.get(ssePaths, async (req: Request, res: Response) => {
    const rawToken = tokenExtractor.extractToken(req);

    if (!rawToken) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Missing token. Provide 'token' query param, path param or 'Authorization: Bearer <token>' header"
      });
      return;
    }

    try {
      const securityContext = jwtVerifier.verifyToken(rawToken);

      // Inicializar transporte SSE con endpoint relativo para los mensajes entrantes
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;
      const server = serverFactory.createServer(securityContext.role);

      sessionManager.registerSession({
        sessionId,
        transport,
        server,
        securityContext
      });

      console.info(
        `[SSE Handshake] Connected sessionId=${sessionId} user=${securityContext.userId} role=${securityContext.role}`
      );

      transport.onclose = () => {
        console.info(`[SSE Closed] Disconnected sessionId=${sessionId}`);
        sessionManager.closeSession(sessionId).catch(() => {});
      };

      transport.onerror = (error) => {
        console.error(`[SSE Error] SessionId=${sessionId}:`, error);
        sessionManager.closeSession(sessionId).catch(() => {});
      };

      await server.connect(transport);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: "UNAUTHORIZED", message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "Internal handshake error";
      res.status(500).json({ error: "INTERNAL_ERROR", message });
    }
  });

  /**
   * Endpoint de mensajes entrantes (JSON-RPC requests desde el cliente MCP).
   */
  const messagePaths = ["/messages", "/token/:token/messages", "/:token/messages"];
  router.post(messagePaths, async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string | undefined;

    if (!sessionId) {
      res.status(400).json({
        error: "INVALID_ARGUMENT",
        message: "Missing 'sessionId' query parameter"
      });
      return;
    }

    if (!sessionManager.hasSession(sessionId)) {
      res.status(404).json({
        error: "SESSION_NOT_FOUND",
        message: `No active SSE transport found for sessionId: ${sessionId}`
      });
      return;
    }

    try {
      const session = sessionManager.getSession(sessionId);
      sessionManager.touchSession(sessionId);

      // Propagar el contexto de seguridad del usuario durante el manejo de la petición JSON-RPC
      await SecurityContextHolder.run(session.securityContext, async () => {
        await session.transport.handlePostMessage(req, res, req.body);
      });
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        res.status(404).json({ error: "SESSION_NOT_FOUND", message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "Error processing MCP message";
      res.status(500).json({ error: "MESSAGE_PROCESSING_ERROR", message });
    }
  });

  return router;
}
