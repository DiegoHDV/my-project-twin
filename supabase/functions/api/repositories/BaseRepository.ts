import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Repositorio base. Encapsula el acceso a una tabla concreta.
 * Las subclases heredan operaciones CRUD genéricas que respetan RLS
 * porque el cliente Supabase ya viene autenticado con el JWT del usuario.
 */
export abstract class BaseRepository<T extends { id?: string }> {
  protected readonly supabase: SupabaseClient;
  protected abstract readonly table: string;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase.from(this.table).select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  }

  public async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as T) ?? null;
  }

  public async insert(payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as T;
  }

  public async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as T;
  }
}
