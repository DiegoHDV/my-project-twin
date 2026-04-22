/**
 * Edge Function "api"
 *
 * Punto de entrada único. Aplica:
 *   1. CORS preflight
 *   2. AuthMiddleware (validación JWT obligatoria en TODOS los endpoints)
 *   3. Router (despacha al controlador correspondiente)
 *   4. ErrorMiddleware (respuestas de error uniformes)
 *
 * Arquitectura POO: Controllers → Services → Repositories.
 */
import { AuthMiddleware } from "./middleware/AuthMiddleware.ts";
import { ErrorMiddleware } from "./middleware/ErrorMiddleware.ts";
import { ResponseFactory } from "./core/ResponseFactory.ts";
import { Router } from "./Router.ts";

const auth = new AuthMiddleware();
const errors = new ErrorMiddleware();
const router = new Router();
const responses = ResponseFactory.getInstance();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return responses.preflight();

  try {
    const ctx = await auth.handle(req); // 401 si JWT inválido / ausente
    return await router.dispatch(ctx);
  } catch (err) {
    return errors.handle(err);
  }
});
