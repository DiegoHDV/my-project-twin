// Utilidad para calcular el "Alcance" de un evento respecto a la ubicación del sponsor.
// Compara ciudad / región / país entre dos ubicaciones en formato libre.
// Si la ubicación solo contiene una ciudad conocida, se infiere su región y país
// usando un diccionario interno (España + grandes capitales internacionales).

export type Reach = "Local" | "Regional" | "Nacional" | "Internacional";

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos

interface ParsedLocation {
  city?: string;
  region?: string;
  country?: string;
}

// Diccionario de ciudades conocidas → región y país (normalizados sin acentos).
// Cubre las principales ciudades de España y grandes capitales internacionales.
// Las claves son ciudades normalizadas (lowercase sin acentos).
const CITY_DB: Record<string, { region: string; country: string }> = {
  // España — Andalucía
  sevilla: { region: "andalucia", country: "espana" },
  malaga: { region: "andalucia", country: "espana" },
  granada: { region: "andalucia", country: "espana" },
  cordoba: { region: "andalucia", country: "espana" },
  cadiz: { region: "andalucia", country: "espana" },
  almeria: { region: "andalucia", country: "espana" },
  huelva: { region: "andalucia", country: "espana" },
  jaen: { region: "andalucia", country: "espana" },
  // Aragón
  zaragoza: { region: "aragon", country: "espana" },
  huesca: { region: "aragon", country: "espana" },
  teruel: { region: "aragon", country: "espana" },
  // Asturias
  oviedo: { region: "asturias", country: "espana" },
  gijon: { region: "asturias", country: "espana" },
  // Baleares
  "palma de mallorca": { region: "islas baleares", country: "espana" },
  palma: { region: "islas baleares", country: "espana" },
  ibiza: { region: "islas baleares", country: "espana" },
  // Canarias
  "las palmas": { region: "canarias", country: "espana" },
  "las palmas de gran canaria": { region: "canarias", country: "espana" },
  "santa cruz de tenerife": { region: "canarias", country: "espana" },
  tenerife: { region: "canarias", country: "espana" },
  // Cantabria
  santander: { region: "cantabria", country: "espana" },
  // Castilla y León
  valladolid: { region: "castilla y leon", country: "espana" },
  burgos: { region: "castilla y leon", country: "espana" },
  leon: { region: "castilla y leon", country: "espana" },
  salamanca: { region: "castilla y leon", country: "espana" },
  segovia: { region: "castilla y leon", country: "espana" },
  avila: { region: "castilla y leon", country: "espana" },
  zamora: { region: "castilla y leon", country: "espana" },
  palencia: { region: "castilla y leon", country: "espana" },
  soria: { region: "castilla y leon", country: "espana" },
  // Castilla-La Mancha
  toledo: { region: "castilla-la mancha", country: "espana" },
  albacete: { region: "castilla-la mancha", country: "espana" },
  guadalajara: { region: "castilla-la mancha", country: "espana" },
  cuenca: { region: "castilla-la mancha", country: "espana" },
  "ciudad real": { region: "castilla-la mancha", country: "espana" },
  // Cataluña
  barcelona: { region: "cataluna", country: "espana" },
  tarragona: { region: "cataluna", country: "espana" },
  lleida: { region: "cataluna", country: "espana" },
  girona: { region: "cataluna", country: "espana" },
  // Comunidad Valenciana
  valencia: { region: "comunidad valenciana", country: "espana" },
  alicante: { region: "comunidad valenciana", country: "espana" },
  castellon: { region: "comunidad valenciana", country: "espana" },
  // Extremadura
  badajoz: { region: "extremadura", country: "espana" },
  caceres: { region: "extremadura", country: "espana" },
  merida: { region: "extremadura", country: "espana" },
  // Galicia
  "santiago de compostela": { region: "galicia", country: "espana" },
  "a coruna": { region: "galicia", country: "espana" },
  coruna: { region: "galicia", country: "espana" },
  vigo: { region: "galicia", country: "espana" },
  ourense: { region: "galicia", country: "espana" },
  lugo: { region: "galicia", country: "espana" },
  pontevedra: { region: "galicia", country: "espana" },
  // Madrid
  madrid: { region: "comunidad de madrid", country: "espana" },
  // Murcia
  murcia: { region: "region de murcia", country: "espana" },
  cartagena: { region: "region de murcia", country: "espana" },
  // Navarra
  pamplona: { region: "navarra", country: "espana" },
  // País Vasco
  bilbao: { region: "pais vasco", country: "espana" },
  "san sebastian": { region: "pais vasco", country: "espana" },
  donostia: { region: "pais vasco", country: "espana" },
  "vitoria-gasteiz": { region: "pais vasco", country: "espana" },
  vitoria: { region: "pais vasco", country: "espana" },
  // La Rioja
  logrono: { region: "la rioja", country: "espana" },
  // Ceuta y Melilla
  ceuta: { region: "ceuta", country: "espana" },
  melilla: { region: "melilla", country: "espana" },

  // Internacional — capitales y grandes ciudades
  lisboa: { region: "lisboa", country: "portugal" },
  porto: { region: "porto", country: "portugal" },
  paris: { region: "ile-de-france", country: "francia" },
  lyon: { region: "auvergne-rhone-alpes", country: "francia" },
  marsella: { region: "provence-alpes-cote dazur", country: "francia" },
  londres: { region: "inglaterra", country: "reino unido" },
  manchester: { region: "inglaterra", country: "reino unido" },
  berlin: { region: "berlin", country: "alemania" },
  munich: { region: "baviera", country: "alemania" },
  roma: { region: "lacio", country: "italia" },
  milan: { region: "lombardia", country: "italia" },
  amsterdam: { region: "holanda septentrional", country: "paises bajos" },
  bruselas: { region: "bruselas", country: "belgica" },
  dublin: { region: "leinster", country: "irlanda" },
  // Latinoamérica
  "buenos aires": { region: "buenos aires", country: "argentina" },
  "ciudad de mexico": { region: "ciudad de mexico", country: "mexico" },
  cdmx: { region: "ciudad de mexico", country: "mexico" },
  guadalajara_mx: { region: "jalisco", country: "mexico" }, // colisión evitada por sufijo
  monterrey: { region: "nuevo leon", country: "mexico" },
  bogota: { region: "cundinamarca", country: "colombia" },
  medellin: { region: "antioquia", country: "colombia" },
  lima: { region: "lima", country: "peru" },
  santiago: { region: "santiago", country: "chile" },
  // EE.UU.
  "nueva york": { region: "nueva york", country: "estados unidos" },
  "new york": { region: "nueva york", country: "estados unidos" },
  "los angeles": { region: "california", country: "estados unidos" },
  miami: { region: "florida", country: "estados unidos" },
};

function parseLocation(loc: string | null | undefined): ParsedLocation {
  if (!loc) return {};
  const parts = loc.split(",").map((p) => norm(p)).filter(Boolean);
  if (parts.length === 0) return {};

  let parsed: ParsedLocation;
  if (parts.length === 1) parsed = { city: parts[0] };
  else if (parts.length === 2) parsed = { city: parts[0], country: parts[1] };
  else parsed = { city: parts[0], region: parts[1], country: parts[2] };

  // Enriquecer con el diccionario si solo tenemos ciudad o faltan datos
  if (parsed.city) {
    const known = CITY_DB[parsed.city];
    if (known) {
      if (!parsed.region) parsed.region = known.region;
      if (!parsed.country) parsed.country = known.country;
    }
  }
  return parsed;
}

/**
 * Calcula el alcance de un evento dado el sponsor que lo visualiza.
 * Devuelve null si no hay datos suficientes para clasificar.
 */
export function computeReach(
  eventLocation: string | null | undefined,
  sponsorLocation: string | null | undefined
): Reach | null {
  if (!eventLocation || !sponsorLocation) return null;
  const e = parseLocation(eventLocation);
  const s = parseLocation(sponsorLocation);

  // Local: misma ciudad
  if (e.city && s.city && e.city === s.city) return "Local";

  // Internacional: países distintos conocidos
  if (e.country && s.country && e.country !== s.country) return "Internacional";

  // Regional: misma región (y por tanto, mismo país implícito)
  if (e.region && s.region && e.region === s.region) return "Regional";

  // Nacional: mismo país, regiones distintas (o región desconocida)
  if (e.country && s.country && e.country === s.country) return "Nacional";

  return null;
}

export const REACH_OPTIONS: Reach[] = ["Local", "Regional", "Nacional", "Internacional"];

// Jerarquía inclusiva: cada nivel "incluye" los inferiores.
// Internacional (4) incluye Nacional (3), Regional (2) y Local (1).
const REACH_RANK: Record<Reach, number> = {
  Local: 1,
  Regional: 2,
  Nacional: 3,
  Internacional: 4,
};

/**
 * ¿El alcance del evento (`eventReach`) entra dentro del filtro `selected` de forma inclusiva?
 * Internacional ⊇ Nacional ⊇ Regional ⊇ Local.
 */
export function reachMatchesFilter(eventReach: Reach | null, selected: Reach): boolean {
  if (!eventReach) return false;
  return REACH_RANK[eventReach] <= REACH_RANK[selected];
}

export const REACH_BADGE_CLASSES: Record<Reach, string> = {
  Local: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  Regional: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  Nacional: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  Internacional: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
};
