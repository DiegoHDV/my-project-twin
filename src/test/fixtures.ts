export const mockSponsor = {
  id: "s1",
  name: "TechCorp",
  industry: "Technology",
  preferred_sectors: ["Tecnología", "Innovación"],
  preferred_event_types: ["Conferencia", "Summit"],
  preferred_audiences: ["Profesionales", "Startups"],
  budget_min: 5000,
  budget_max: 20000,
  avatar_url: null,
  role: "sponsor",
} as any;

export const mockEvent = {
  id: "e1",
  title: "Tech Summit Madrid",
  sector: "Tecnología",
  type: "Conferencia",
  audience: "Profesionales",
  sponsorship_min: 8000,
  sponsorship_max: 15000,
  location: "Madrid",
} as any;

export const noMatchEvent = {
  id: "e2",
  title: "Festival de Jazz",
  sector: "Música",
  type: "Festival",
  audience: "Familias",
  sponsorship_min: 500,
  sponsorship_max: 1000,
  location: "Sevilla",
} as any;
