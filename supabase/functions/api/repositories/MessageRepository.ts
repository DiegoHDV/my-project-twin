import { BaseRepository } from "./BaseRepository.ts";

export interface MessageRow {
  id?: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  seen?: boolean | null;
}

export class MessageRepository extends BaseRepository<MessageRow> {
  protected readonly table = "messages";

  public async findByConversation(conversationId: string): Promise<MessageRow[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as MessageRow[];
  }
}
