import { BaseService } from "./BaseService.ts";
import { ProfileRepository, ProfileRow } from "../repositories/ProfileRepository.ts";
import { NotFoundException } from "../core/HttpException.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";

export class ProfileService extends BaseService {
  private readonly profiles: ProfileRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.profiles = new ProfileRepository(ctx.supabase);
  }

  public async me(): Promise<ProfileRow> {
    const profile = await this.profiles.findByUserId(this.ctx.user.id);
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  public listSponsors(): Promise<ProfileRow[]> {
    return this.profiles.findSponsors();
  }
}
