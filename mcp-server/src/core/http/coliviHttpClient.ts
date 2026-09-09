import axios, { AxiosInstance, AxiosError } from "axios";
import { env } from "../../config/env.js";
import { SecurityContextHolder } from "../security/securityContext.js";
import { BackendIntegrationError, UnauthorizedError, ForbiddenError } from "../errors/mcpError.js";
import { IHttpClient } from "./types.js";

export class ColiviHttpClient implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string = env.SPRING_API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        Accept: "application/json"
      }
    });

    // Interceptor para inyectar dinámicamente el Bearer token del contexto activo
    this.client.interceptors.request.use((config) => {
      const context = SecurityContextHolder.tryGetContext();
      if (context?.token) {
        config.headers.Authorization = `Bearer ${context.token}`;
      }
      return config;
    });
  }

  /**
   * Ejecuta peticiones GET seguras hacia el backend de Spring Boot.
   * Regla de Solo Lectura: No existen métodos post, put, patch o delete.
   */
  public async get<T>(path: string, queryParams?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, {
        params: queryParams
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(path, error);
      throw error;
    }
  }

  private handleAxiosError(path: string, error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ message?: string; error?: string }>;
      const status = axiosErr.response?.status;
      const backendMessage =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        axiosErr.message;

      if (status === 401) {
        throw new UnauthorizedError(`Backend rejected authentication on [${path}]: ${backendMessage}`);
      }

      if (status === 403) {
        throw new ForbiddenError(`Backend access denied on [${path}]: ${backendMessage}`);
      }

      throw new BackendIntegrationError(path, backendMessage, status ?? 502);
    }

    const message = error instanceof Error ? error.message : "Unknown HTTP error";
    throw new BackendIntegrationError(path, message, 500);
  }
}

export const httpClient = new ColiviHttpClient();
