import { BaseController } from "./BaseController.ts";
import { MessageService } from "../services/MessageService.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";
import { BadRequestException } from "../core/HttpException.ts";

export class MessagesController extends BaseController {
  public async handle(ctx: RequestContext): Promise<Response> {
    const service = new MessageService(ctx);
    const conversationId = ctx.url.searchParams.get("conversationId") ?? "";

    if (ctx.req.method === "GET") {
      return this.responses.json(await service.listByConversation(conversationId));
    }
    if (ctx.req.method === "POST") {
      const body = await this.parseJson<{ conversationId?: string; content?: string }>(ctx.req);
      const sent = await service.send(body.conversationId ?? conversationId, body.content ?? "");
      return this.responses.json(sent, 201);
    }
    throw new BadRequestException(`Method ${ctx.req.method} not allowed on /messages`);
  }
}
