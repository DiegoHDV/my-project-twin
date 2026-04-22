import { BaseService } from "./BaseService.ts";
import { EventRepository, EventRow } from "../repositories/EventRepository.ts";
import { ProfileRepository } from "../repositories/ProfileRepository.ts";
import { BadRequestException, ForbiddenException, NotFoundException } from "../core/HttpException.ts";
import { RequestContext } from "../middleware/AuthMiddleware.ts";

export class EventService extends BaseService {
  private readonly events: EventRepository;
  private readonly profiles: ProfileRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.events = new EventRepository(ctx.supabase);
    this.profiles = new ProfileRepository(ctx.supabase);
  }

  public listPublished(): Promise<EventRow[]> {
    return this.events.findPublished();
  }

  public async getById(id: string): Promise<EventRow> {
    const ev = await this.events.findById(id);
    if (!ev) throw new NotFoundException("Event not found");
    return ev;
  }

  public async create(payload: Partial<EventRow>): Promise<EventRow> {
    if (!payload.title?.trim()) {
      throw new BadRequestException("title is required");
    }
    const profile = await this.profiles.findByUserId(this.ctx.user.id);
    if (!profile) throw new ForbiddenException("Profile not found");
    if (profile.role !== "organizer") {
      throw new ForbiddenException("Only organizers can create events");
    }
    return this.events.insert({ ...payload, organizer_id: profile.id! });
  }
}
