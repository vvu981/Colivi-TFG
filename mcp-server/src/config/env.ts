import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env local de mcp-server o de la raíz del proyecto
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MCP_PORT: z.coerce.number().default(3001),
  SPRING_API_BASE_URL: z.string().url().default("http://localhost:8080/api/v1"),
  JWT_SECRET: z
    .string()
    .min(1)
    .default(
      process.env.JWT_SECRET ||
        "ZXN0YS1jbGF2ZS1zZWNyZXRhLXRpZW5lLXF1ZS1zZXItbXV5LWxhcmdhLXktY29tcGxlamE="
    )
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:", parsedEnv.error.format());
  throw new Error("Invalid environment configuration for MCP Server");
}

export const env = parsedEnv.data;
