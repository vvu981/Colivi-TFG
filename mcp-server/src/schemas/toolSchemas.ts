import { Tool as McpToolDefinition } from "@modelcontextprotocol/sdk/types.js";

export const SEARCH_COLIVING_LISTINGS_TOOL: McpToolDefinition = {
  name: "search_coliving_listings",
  description: "Busca anuncios de coliving por ubicación, precio máximo y ambiente.",
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
        description: "Filtro de ambiente de convivencia"
      }
    },
    required: ["location"]
  }
};

export const GET_USER_CHORES_STATUS_TOOL: McpToolDefinition = {
  name: "get_user_chores_status",
  description: "Tareas domésticas pendientes del usuario y puntuación en su piso.",
  inputSchema: {
    type: "object",
    properties: {
      homeId: {
        type: "string",
        description: "UUID opcional del hogar. Si se omite, se usa el activo."
      }
    },
    required: []
  }
};

export const SUMMARIZE_HOST_INBOX_TOOL: McpToolDefinition = {
  name: "summarize_host_inbox",
  description: "Resumen de mensajes no leídos del propietario e inquilinos candidatos.",
  inputSchema: {
    type: "object",
    properties: {
      listingId: {
        type: "string",
        description: "UUID opcional del anuncio para filtrar"
      }
    },
    required: []
  }
};

export const GET_MODERATION_QUEUE_TOOL: McpToolDefinition = {
  name: "get_moderation_queue",
  description: "Exclusivo ADMIN: Top 10 denuncias pendientes.",
  inputSchema: {
    type: "object",
    properties: {
      targetType: {
        type: "string",
        enum: ["USER", "LISTING"],
        description: "Tipo de entidad denunciada"
      }
    },
    required: ["targetType"]
  }
};

export const GET_MY_BOOKINGS_STATUS_TOOL: McpToolDefinition = {
  name: "get_my_bookings_status",
  description: "Historial y estado de reservas del inquilino (PENDING, ACCEPTED, CONFIRMED).",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

export const GET_LISTING_DETAILS_TOOL: McpToolDefinition = {
  name: "get_listing_details",
  description: "Ficha técnica completa de un anuncio por UUID: fianza, servicios y normas.",
  inputSchema: {
    type: "object",
    properties: {
      listingId: {
        type: "string",
        description: "UUID del anuncio de alojamiento"
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
