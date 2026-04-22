import { HttpException } from "../core/HttpException.ts";
import { ResponseFactory } from "../core/ResponseFactory.ts";

/**
 * Traduce excepciones a respuestas HTTP uniformes.
 */
export class ErrorMiddleware {
  private readonly responses = ResponseFactory.getInstance();

  public handle(err: unknown): Response {
    if (err instanceof HttpException) {
      return this.responses.error(err.message, err.status, err.details);
    }
    console.error("[api] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return this.responses.error(message, 500);
  }
}
