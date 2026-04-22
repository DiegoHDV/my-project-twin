import { BaseRepository } from "./BaseRepository.ts";

export interface ProfileRow {
  id?: string;
  user_id: string;
  role: "organizer" | "sponsor";
  name: string;
  location?: string | null;
}

export class ProfileRepository extends BaseRepository<ProfileRow> {
  protected readonly table = "profiles";

  public async findByUserId(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProfileRow) ?? null;
  }

  public async findSponsors(): Promise<ProfileRow[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("role", "sponsor");
    if (error) throw new Error(error.message);
    return (data ?? []) as ProfileRow[];
  }
}
