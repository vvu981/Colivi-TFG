import { Router, Request, Response } from "express";
import { ISessionManager } from "../../session/types.js";

export function createHealthRouter(sessionManager: ISessionManager): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "UP",
      service: "colivi-mcp-server",
      activeSessions: sessionManager.count(),
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
