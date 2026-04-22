import { BaseService } from "./BaseService";

export interface ApiEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string | null;
  published: boolean | null;
}

export class EventService extends BaseService {
  public list() { return this.api.get<ApiEvent[]>("/events"); }
  public getById(id: string) { return this.api.get<ApiEvent>(`/events/${id}`); }
  public create(payload: Partial<ApiEvent>) { return this.api.post<ApiEvent>("/events", payload); }
}
