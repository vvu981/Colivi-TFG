import { IHttpClient } from "../core/http/types.js";
import { httpClient } from "../core/http/coliviHttpClient.js";
import { PageResponse } from "./listingClient.js";

export interface ConversationSummary {
  conversationId: string;
  listingId: string;
  listingTitle: string;
  interlocutorId: string;
  interlocutorName: string;
  interlocutorProfilePic?: string;
  activeBookingRequestId?: string;
  bookingStatus?: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isHost: boolean;
  isArchived: boolean;
}

export interface IMessagingClient {
  getInbox(params?: { archived?: boolean; page?: number; size?: number }): Promise<PageResponse<ConversationSummary>>;
}

export class MessagingClient implements IMessagingClient {
  constructor(private readonly http: IHttpClient = httpClient) {}

  public async getInbox(params?: {
    archived?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ConversationSummary>> {
    return this.http.get<PageResponse<ConversationSummary>>("/conversations", {
      archived: params?.archived ?? false,
      page: params?.page ?? 0,
      size: params?.size ?? 50
    });
  }
}

export const messagingClient = new MessagingClient();
