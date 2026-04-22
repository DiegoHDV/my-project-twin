import { corsHeaders } from "./cors.ts";

/**
 * Singleton encargado de construir respuestas HTTP uniformes.
 * Centraliza headers CORS y formato JSON.
 */
export class ResponseFactory {
  private static instance: ResponseFactory;

  private constructor() {}

  public static getInstance(): ResponseFactory {
    if (!ResponseFactory.instance) {
      ResponseFactory.instance = new ResponseFactory();
    }
    return ResponseFactory.instance;
  }

  public json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  public error(message: string, status = 500, details?: unknown): Response {
    return this.json({ error: message, status, details }, status);
  }

  public preflight(): Response {
    return new Response(null, { headers: corsHeaders });
  }
}
