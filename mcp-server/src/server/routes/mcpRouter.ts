import crypto from "node:crypto";
import { Router, Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ISessionManager } from "../../session/types.js";
import { IMcpServerFactory } from "../../mcp/types.js";
import { IJwtVerifier, defaultJwtVerifier } from "../../core/security/jwtVerifier.js";
import { ITokenExtractor, defaultTokenExtractor } from "../../core/security/tokenExtractor.js";
import { ITicketManager, defaultTicketManager } from "../../core/security/ticketManager.js";
import { SecurityContextHolder, SecurityContext } from "../../core/security/securityContext.js";
import { UnauthorizedError, SessionNotFoundError } from "../../core/errors/mcpError.js";

export interface McpRouterDependencies {
  readonly sessionManager: ISessionManager;
  readonly serverFactory: IMcpServerFactory;
  readonly jwtVerifier?: IJwtVerifier;
  readonly tokenExtractor?: ITokenExtractor;
  readonly ticketManager?: ITicketManager;
}

export function createMcpRouter(deps: McpRouterDependencies): Router {
  const router = Router();
  const jwtVerifier = deps.jwtVerifier ?? defaultJwtVerifier;
  const tokenExtractor = deps.tokenExtractor ?? defaultTokenExtractor;
  const ticketManager = deps.ticketManager ?? defaultTicketManager;
  const sessionManager = deps.sessionManager;
  const serverFactory = deps.serverFactory;

  /**
   * Endpoint de intercambio de ticket efímero de sesión de un solo uso (SEC-01).
   * El cliente envía su JWT en la cabecera estándar 'Authorization: Bearer <token>'
   * y recibe un ticket UUID efímero válido durante 30s.
   */
  router.post("/auth/ticket", async (req: Request, res: Response) => {
    const rawToken = tokenExtractor.extractToken(req);

    if (!rawToken) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Missing Bearer token in Authorization header"
      });
      return;
    }

    try {
      const securityContext = jwtVerifier.verifyToken(rawToken);
      const ticket = ticketManager.createTicket(securityContext, 30000);
      res.status(200).json({ ticket });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: "UNAUTHORIZED", message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "Error generating ticket";
      res.status(500).json({ error: "INTERNAL_ERROR", message });
    }
  });

  /**
   * Handshake SSE: Valida ticket efímero o token Bearer y establece el canal de streaming.
   * Se elimina la ruta con JWT en URL (/token/:token/sse) para prevenir fuga en logs (SEC-01).
   */
  // F-12: Se elimina la ruta generica "/:ticket/sse" que capturaria cualquier
  // path de primer nivel terminado en /sse, colisionando con rutas futuras.
  // Solo se mantiene "/sse" (Bearer header) y "/ticket/:ticket/sse" (ticket efimero).
  const ssePaths = ["/sse", "/ticket/:ticket/sse"];
  router.get(ssePaths, async (req: Request, res: Response) => {
    let securityContext: SecurityContext | undefined;

    const ticketParam = req.params.ticket;
    const ticketQuery = req.query.ticket as string | undefined;
    const ticket = ticketParam || ticketQuery;

    if (ticket) {
      securityContext = ticketManager.consumeTicket(ticket);
      if (!securityContext) {
        res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Invalid or expired ticket"
        });
        return;
      }
    } else {
      const rawToken = tokenExtractor.extractToken(req);
      if (!rawToken) {
        res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Missing authentication. Provide ticket or 'Authorization: Bearer <token>' header"
        });
        return;
      }

      try {
        securityContext = jwtVerifier.verifyToken(rawToken);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          res.status(401).json({ error: "UNAUTHORIZED", message: error.message });
          return;
        }
        const message = error instanceof Error ? error.message : "Internal handshake error";
        res.status(500).json({ error: "INTERNAL_ERROR", message });
        return;
      }
    }

    try {
      // SEC-02: Generar un secreto criptográfico único de sesión para enlazar los mensajes entrantes
      const sessionSecret = crypto.randomUUID();
      const transport = new SSEServerTransport(`/messages?sessionToken=${sessionSecret}`, res);
      const sessionId = transport.sessionId;
      const server = serverFactory.createServer(securityContext.role);

      sessionManager.registerSession({
        sessionId,
        sessionSecret,
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
   * Protegido contra suplantación de sesión mediante verificación de sessionToken o Bearer token (SEC-02).
   */
  // BUG-01: El cliente Java SDK oficial de MCP (HttpClientSseClientTransport) resuelve
  // la URL del endpoint de mensajes concatenando su URI base (/ticket/{ticket}) con el
  // endpoint recibido (/messages?...). Por ello, el servidor debe escuchar en ambas rutas.
  const messagePaths = ["/messages", "/ticket/:ticket/messages"];
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

      // Verificación estricta de autorización en /messages (SEC-02 / SEC-03)
      const sessionToken = req.query.sessionToken as string | undefined;
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.replace(/^Bearer\s+/i, "")?.trim();

      // F-13: Uso de timingSafeEqual para comparar secretos criptograficos.
      // La comparacion === no es de tiempo constante y puede filtrar informacion
      // del secreto via timing attacks en mediciones de latencia de respuesta.
      const isSessionTokenValid =
        !!sessionToken &&
        sessionToken.length === session.sessionSecret.length &&
        crypto.timingSafeEqual(Buffer.from(sessionToken), Buffer.from(session.sessionSecret));

      const isBearerTokenValid =
        !!bearerToken &&
        bearerToken.length === session.securityContext.token.length &&
        crypto.timingSafeEqual(Buffer.from(bearerToken), Buffer.from(session.securityContext.token));

      const isAuthorized = isSessionTokenValid || isBearerTokenValid;

      if (!isAuthorized) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Unauthorized message dispatch: valid sessionToken or matching Bearer token required"
        });
        return;
      }

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
