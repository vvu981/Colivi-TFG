export type AiRole = 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: string;
  draftContent?: string;
}

export interface AiChatHistoryItem {
  role: AiRole;
  content: string;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatHistoryItem[];
}

export interface AiChatResponse {
  response: string;
  draft?: string;
  toolsUsed?: string[];
}

export interface QuickPromptSuggestion {
  id: string;
  label: string;
  prompt: string;
}
