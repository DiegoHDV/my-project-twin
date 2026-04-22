import { ResponseFactory } from "../core/ResponseFactory.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";

/**
 * Controlador base. Define la firma handle() y utilidades comunes.
 */
export abstract class BaseController {
  protected readonly responses = ResponseFactory.getInstance();

  public abstract handle(ctx: RequestContext, segments: string[]): Promise<Response>;

  protected async parseJson<T = unknown>(req: Request): Promise<T> {
    try {
      return (await req.json()) as T;
    } catch {
      return {} as T;
    }
  }
}
