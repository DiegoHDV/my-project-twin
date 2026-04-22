import { BaseService } from "./BaseService";

export interface ApiMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  seen: boolean | null;
  created_at: string;
}

export class MessageService extends BaseService {
  public listByConversation(conversationId: string) {
    return this.api.get<ApiMessage[]>(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
  }
  public send(conversationId: string, content: string) {
    return this.api.post<ApiMessage>("/messages", { conversationId, content });
  }
}
