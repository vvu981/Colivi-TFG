import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { UserRole } from "../core/security/securityContext.js";

export interface IMcpServerFactory {
  createServer(role?: UserRole): Server;
}
