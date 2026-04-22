import { BaseController } from "./BaseController.ts";
import { EventService } from "../services/EventService.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";
import { BadRequestException, NotFoundException } from "../core/HttpException.ts";

export class EventsController extends BaseController {
  public async handle(ctx: RequestContext, segments: string[]): Promise<Response> {
    const service = new EventService(ctx);
    const [, id] = segments; // segments[0] === 'events'
    const method = ctx.req.method;

    if (!id) {
      if (method === "GET") return this.responses.json(await service.listPublished());
      if (method === "POST") {
        const body = await this.parseJson<Record<string, unknown>>(ctx.req);
        const created = await service.create(body);
        return this.responses.json(created, 201);
      }
      throw new BadRequestException(`Method ${method} not allowed on /events`);
    }

    if (method === "GET") return this.responses.json(await service.getById(id));
    throw new NotFoundException();
  }
}
