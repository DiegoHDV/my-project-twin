import { supabase } from "@/integrations/supabase/client";

/**
 * Cliente HTTP (Singleton) para llamar a la Edge Function `api`.
 *
 * Inyecta automáticamente el JWT del usuario autenticado en cada request.
 * Si no hay sesión activa lanza Error: protege el frontend contra llamadas
 * anónimas a endpoints que requieren JWT.
 */
export class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string;

  private constructor() {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
    this.baseUrl = `https://${projectId}.functions.supabase.co/api`;
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }

  private async authHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("No active session: cannot call API without JWT");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = await this.authHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const message = (data && data.error) || `HTTP ${res.status}`;
      throw new Error(message);
    }
    return data as T;
  }

  public get<T>(path: string) { return this.request<T>("GET", path); }
  public post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, body); }
  public put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, body); }
  public del<T>(path: string) { return this.request<T>("DELETE", path); }
}
