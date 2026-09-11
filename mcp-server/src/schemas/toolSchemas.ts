import { Tool as McpToolDefinition } from "@modelcontextprotocol/sdk/types.js";

export const SEARCH_COLIVING_LISTINGS_TOOL: McpToolDefinition = {
  name: "search_coliving_listings",
  description:
    "Busca anuncios de coliving cruzando filtros tradicionales (precio, ubicación) con métricas de estilo de vida de los inquilinos actuales (ej. cumplimiento de tareas).",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Ciudad o barrio"
      },
      maxPrice: {
        type: "number",
        description: "Precio máximo mensual en euros"
      },
      requiredVibe: {
        type: "string",
        enum: ["TIDY", "SOCIAL", "QUIET", "ANY"],
        description: "Filtro semántico del ambiente basado en el ranking de tareas de la casa"
      }
    },
    required: ["location"]
  }
};

export const GET_USER_CHORES_STATUS_TOOL: McpToolDefinition = {
  name: "get_user_chores_status",
  description:
    "Obtiene las tareas domésticas pendientes del usuario autenticado y su puntuación actual frente a sus compañeros de piso.",
  inputSchema: {
    type: "object",
    properties: {
      homeId: {
        type: "string",
        description:
          "UUID opcional del hogar a consultar si el usuario pertenece a más de uno. Si se omite, se consulta el primer hogar activo."
      }
    },
    required: []
  }
};

export const SUMMARIZE_HOST_INBOX_TOOL: McpToolDefinition = {
  name: "summarize_host_inbox",
  description:
    "Obtiene un resumen de los mensajes no leídos del propietario y el perfil/estado de los inquilinos candidatos en esas conversaciones.",
  inputSchema: {
    type: "object",
    properties: {
      listingId: {
        type: "string",
        description: "UUID opcional del anuncio para filtrar. Si es null, trae todo el inbox."
      }
    },
    required: []
  }
};

export const GET_MODERATION_QUEUE_TOOL: McpToolDefinition = {
  name: "get_moderation_queue",
  description:
    "Exclusivo para ADMIN. Devuelve el Top 10 de anuncios o usuarios con mayor número de denuncias pendientes de revisión.",
  inputSchema: {
    type: "object",
    properties: {
      targetType: {
        type: "string",
        enum: ["USER", "LISTING"],
        description: "Tipo de entidad denunciada a auditar"
      }
    },
    required: ["targetType"]
  }
};

export const GET_MY_BOOKINGS_STATUS_TOOL: McpToolDefinition = {
  name: "get_my_bookings_status",
  description:
    "Obtiene el historial y estado actual de las solicitudes de reserva del inquilino autenticado (PENDING, ACCEPTED, CONFIRMED, REJECTED) y si requieren acción inmediata como pagar fianza.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

export const GET_LISTING_DETAILS_TOOL: McpToolDefinition = {
  name: "get_listing_details",
  description:
    "Obtiene la ficha técnica completa de un anuncio por su ID: desglose de fianza, servicios incluidos (wifi, calefacción), normas de convivencia y fechas de disponibilidad.",
  inputSchema: {
    type: "object",
    properties: {
      listingId: {
        type: "string",
        description: "UUID del anuncio de alojamiento a consultar"
      }
    },
    required: ["listingId"]
  }
};

export const ALL_MCP_TOOLS: McpToolDefinition[] = [
  SEARCH_COLIVING_LISTINGS_TOOL,
  GET_USER_CHORES_STATUS_TOOL,
  SUMMARIZE_HOST_INBOX_TOOL,
  GET_MODERATION_QUEUE_TOOL,
  GET_MY_BOOKINGS_STATUS_TOOL,
  GET_LISTING_DETAILS_TOOL
];
