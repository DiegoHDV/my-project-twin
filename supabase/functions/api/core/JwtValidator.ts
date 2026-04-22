import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { UnauthorizedException } from "./HttpException.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  claims: Record<string, unknown>;
}

/**
 * Clase encargada de validar JWT de Supabase.
 * Verifica firma, expiración y formato delegando en getClaims().
 */
export class JwtValidator {
  private readonly supabaseUrl: string;
  private readonly anonKey: string;

  constructor() {
    this.supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    this.anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!this.supabaseUrl || !this.anonKey) {
      throw new Error("Missing Supabase env vars");
    }
  }

  /**
   * Extrae y valida el JWT del header Authorization.
   * Lanza UnauthorizedException si falta, está mal formado o es inválido.
   */
  public async validate(req: Request): Promise<{ user: AuthenticatedUser; client: SupabaseClient }> {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new UnauthorizedException("Missing Authorization header");
    }
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authorization header must use Bearer scheme");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token.split(".").length !== 3) {
      throw new UnauthorizedException("Malformed JWT");
    }

    // Cliente con el token del usuario para que respete RLS.
    const client = createClient(this.supabaseUrl, this.anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const claims = data.claims as Record<string, unknown>;
    const user: AuthenticatedUser = {
      id: String(claims.sub ?? ""),
      email: claims.email as string | undefined,
      role: claims.role as string | undefined,
      claims,
    };

    if (!user.id) {
      throw new UnauthorizedException("Token missing subject");
    }

    return { user, client };
  }
}
