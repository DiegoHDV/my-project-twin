import { ApiClient } from "./ApiClient.ts";

/**
 * Servicio base. Las subclases reciben el ApiClient (Singleton)
 * y exponen métodos de dominio.
 */
export abstract class BaseService {
  protected readonly api: ApiClient;
  constructor(api: ApiClient = ApiClient.getInstance()) {
    this.api = api;
  }
}
