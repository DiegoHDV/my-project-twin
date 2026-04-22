import { BaseController } from "./controllers/BaseController.ts";
import { EventsController } from "./controllers/EventsController.ts";
import { ProfilesController } from "./controllers/ProfilesController.ts";
import { MessagesController } from "./controllers/MessagesController.ts";
import { RequestContext } from "./middleware/AuthMiddleware.ts";
import { NotFoundException } from "./core/HttpException.ts";

/**
 * Router simple basado en el primer segmento de la ruta.
 * Mapea /events, /profiles, /messages a su controlador.
 */
export class Router {
  private readonly routes: Map<string, BaseController>;

  constructor() {
    this.routes = new Map<string, BaseController>([
      ["events", new EventsController()],
      ["profiles", new ProfilesController()],
      ["messages", new MessagesController()],
    ]);
  }

  public async dispatch(ctx: RequestContext): Promise<Response> {
    // El path llega como /api/<resource>/...; quitamos el prefijo "api".
    const segments = ctx.url.pathname
      .split("/")
      .filter(Boolean)
      .filter((s) => s !== "api");

    const resource = segments[0];
    const controller = resource ? this.routes.get(resource) : undefined;
    if (!controller) {
      throw new NotFoundException(`Route /${segments.join("/")} not found`);
    }
    return controller.handle(ctx, segments);
  }
}
