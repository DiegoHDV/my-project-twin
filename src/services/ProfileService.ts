import { BaseService } from "./BaseService";

export interface ApiProfile {
  id: string;
  user_id: string;
  role: "organizer" | "sponsor";
  name: string;
  location: string | null;
}

export class ProfileService extends BaseService {
  public me() { return this.api.get<ApiProfile>("/profiles/me"); }
  public listSponsors() { return this.api.get<ApiProfile[]>("/profiles"); }
}
