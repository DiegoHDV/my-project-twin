import { BaseController } from "./BaseController.ts";
import { ProfileService } from "../services/ProfileService.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";
import { NotFoundException } from "../core/HttpException.ts";

export class ProfilesController extends BaseController {
  public async handle(ctx: RequestContext, segments: string[]): Promise<Response> {
    const service = new ProfileService(ctx);
    const [, sub] = segments; // segments[0] === 'profiles'

    if (sub === "me" && ctx.req.method === "GET") {
      return this.responses.json(await service.me());
    }
    if (!sub && ctx.req.method === "GET") {
      // Por simplicidad, /profiles devuelve los sponsors visibles.
      return this.responses.json(await service.listSponsors());
    }
    throw new NotFoundException();
  }
}
