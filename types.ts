
export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | MessageContentPart[];
  timestamp: number;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
}

export type Theme = 'light' | 'dark' | 'system';
