import { MapPin, Map, Flag, Globe2, type LucideIcon } from "lucide-react";

export type Alcance = "Local" | "Regional" | "Nacional" | "Internacional";

export const ALCANCE_OPTIONS: Alcance[] = ["Local", "Regional", "Nacional", "Internacional"];

export const ALCANCE_ICONS: Record<Alcance, LucideIcon> = {
  Local: MapPin,
  Regional: Map,
  Nacional: Flag,
  Internacional: Globe2,
};

// Tailwind classes for the badge per alcance (semantic color families)
export const ALCANCE_BADGE_CLASS: Record<Alcance, string> = {
  Local: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  Regional: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  Nacional: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  Internacional: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
};
