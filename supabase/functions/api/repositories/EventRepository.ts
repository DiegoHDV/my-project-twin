import { BaseRepository } from "./BaseRepository.ts";

export interface EventRow {
  id?: string;
  organizer_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  published?: boolean | null;
}

export class EventRepository extends BaseRepository<EventRow> {
  protected readonly table = "events";

  public async findPublished(): Promise<EventRow[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("published", true)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as EventRow[];
  }

  public async findByOrganizer(organizerId: string): Promise<EventRow[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("organizer_id", organizerId);
    if (error) throw new Error(error.message);
    return (data ?? []) as EventRow[];
  }
}
