import { BaseService } from "./BaseService.ts";
import { MessageRepository, MessageRow } from "../repositories/MessageRepository.ts";
import { ProfileRepository } from "../repositories/ProfileRepository.ts";
import { BadRequestException, ForbiddenException } from "../core/HttpException.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";

export class MessageService extends BaseService {
  private readonly messages: MessageRepository;
  private readonly profiles: ProfileRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.messages = new MessageRepository(ctx.supabase);
    this.profiles = new ProfileRepository(ctx.supabase);
  }

  public listByConversation(conversationId: string): Promise<MessageRow[]> {
    if (!conversationId) throw new BadRequestException("conversationId is required");
    return this.messages.findByConversation(conversationId);
  }

  public async send(conversationId: string, content: string): Promise<MessageRow> {
    if (!conversationId) throw new BadRequestException("conversationId is required");
    if (!content?.trim()) throw new BadRequestException("content is required");

    const profile = await this.profiles.findByUserId(this.ctx.user.id);
    if (!profile) throw new ForbiddenException("Profile not found");

    return this.messages.insert({
      conversation_id: conversationId,
      sender_id: profile.id!,
      content,
    });
  }
}
