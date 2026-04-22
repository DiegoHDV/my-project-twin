import { RequestContext } from "../middleware/AuthMiddleware.ts";

/**
 * Servicio base. Las subclases reciben el contexto autenticado
 * y exponen lógica de negocio reutilizable.
 */
export abstract class BaseService {
  protected readonly ctx: RequestContext;

  constructor(ctx: RequestContext) {
    this.ctx = ctx;
  }
}
