export class McpError extends Error {
  public readonly code: number;
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500, code: number = -32603) {
    super(message);
    this.name = "McpError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends McpError {
  constructor(message: string = "Authentication required or invalid token") {
    super(message, 401, -32001);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends McpError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403, -32003);
    this.name = "ForbiddenError";
  }
}

export class SessionNotFoundError extends McpError {
  constructor(sessionId: string) {
    super(`Active SSE session not found for id: ${sessionId}`, 404, -32004);
    this.name = "SessionNotFoundError";
  }
}

export class BackendIntegrationError extends McpError {
  constructor(serviceName: string, detail: string, statusCode: number = 502) {
    super(`Backend communication failure in [${serviceName}]: ${detail}`, statusCode, -32002);
    this.name = "BackendIntegrationError";
  }
}

export class InvalidArgumentError extends McpError {
  constructor(message: string) {
    super(message, 400, -32602);
    this.name = "InvalidArgumentError";
  }
}
