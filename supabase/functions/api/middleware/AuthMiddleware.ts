import { JwtValidator, AuthenticatedUser } from "../core/JwtValidator.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export interface RequestContext {
  user: AuthenticatedUser;
  supabase: SupabaseClient;
  url: URL;
  req: Request;
}

/**
 * Middleware centralizado de autenticación.
 * Toda ruta que pase por handle() queda protegida con JWT.
 */
export class AuthMiddleware {
  private readonly validator: JwtValidator;

  constructor(validator: JwtValidator = new JwtValidator()) {
    this.validator = validator;
  }

  public async handle(req: Request): Promise<RequestContext> {
    const { user, client } = await this.validator.validate(req);
    return { user, supabase: client, url: new URL(req.url), req };
  }
}
