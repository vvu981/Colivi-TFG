import { env } from "./config/env.js";
import { createDefaultToolRegistry } from "./tools/registry.js";
import { McpServerFactory } from "./mcp/mcpServerFactory.js";
import { McpSessionManager } from "./session/sessionManager.js";
import { createApp } from "./server/app.js";

// Inicialización del catálogo de herramientas y gestor de sesiones
const toolRegistry = createDefaultToolRegistry();
const serverFactory = new McpServerFactory({ toolRegistry });
const sessionManager = new McpSessionManager();

// Construcción de la aplicación Express
export const app = createApp({
  sessionManager,
  toolRegistry,
  serverFactory
});

const port = env.MCP_PORT;
const server = app.listen(port, () => {
  console.info(`Colivi MCP Server listening on port ${port} (SSE Transport)`);
});

// Limpieza periódica de sesiones inactivas (cada 10 minutos para sesiones de más de 1 hora)
const cleanupInterval = setInterval(() => {
  sessionManager.cleanupStaleSessions(60 * 60 * 1000).catch((err) => {
    console.error("[Session Cleanup Error]:", err);
  });
}, 10 * 60 * 1000);
cleanupInterval.unref();

// Apagado ordenado (Graceful Shutdown) ante señales del sistema o Docker
const shutdown = async (signal: string) => {
  console.info(`[Shutdown] Received ${signal}. Closing server and draining active sessions...`);
  clearInterval(cleanupInterval);

  server.close(async (err) => {
    if (err) {
      console.error("[Shutdown Error]: Failed to close HTTP server", err);
    }
    try {
      await sessionManager.closeAll();
      console.info("[Shutdown] All active MCP sessions terminated cleanly.");
      process.exit(0);
    } catch (sessionErr) {
      console.error("[Shutdown Error]: Failed while closing sessions", sessionErr);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
