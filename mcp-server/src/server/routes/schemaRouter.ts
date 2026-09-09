import { Router, Request, Response } from "express";
import { IToolRegistry } from "../../tools/registry.js";

export function createSchemaRouter(toolRegistry: IToolRegistry): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      name: "colivi-mcp-server",
      version: "1.0.0",
      description: "Herramientas de contexto de modelo (MCP) para Colivi",
      tools: toolRegistry.getAllDefinitions()
    });
  });

  return router;
}
