export interface BaseMessage {
  id: string;
  username: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  isPrivate?: boolean;
  to?: string;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
}

export interface ImageMessage extends BaseMessage {
  type: 'image';
  imageUrl: string;
}

export type Message = TextMessage | ImageMessage;

export interface ChatUser {
  username: string;
  id: string;
}

export interface ChatSession {
  id: string;
  name: string;
  type: 'group' | 'private';
  lastMessage?: Message;
  hasUnread: boolean;
} 