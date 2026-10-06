export type MessageType = 'USER_MESSAGE' | 'SYSTEM_MESSAGE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  createdAt: string;
  readAt?: string | null;
  isMine: boolean;
  isPending?: boolean;
}

export interface ConversationSummary {
  conversationId: string;
  listingId: string;
  listingTitle: string;
  listingThumbnailUrl?: string | null;
  listingPricePerMonth: number;
  interlocutorId: string;
  interlocutorName: string;
  interlocutorProfilePic?: string | null;
  activeBookingRequestId?: string | null;
  bookingStatus: 'CONSULTATION' | 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  bookingStartDate?: string | null;
  bookingEndDate?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  interlocutorUnreadCount?: number;
  isArchived: boolean;
  isHost: boolean;
  isReported?: boolean;
  isReadOnly?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SendMessageRequest {
  content: string;
}
