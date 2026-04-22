import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    region?: string;
    country?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

/**
 * Formats a Nominatim result as "City, Region, Country".
 */
function formatLocation(r: NominatimResult): string {
  const a = r.address || {};
  const city = a.city || a.town || a.village || a.municipality;
  const region = a.state || a.region;
  const country = a.country;
  const parts = [city, region, country].filter(Boolean);
  if (parts.length === 0) return r.display_name;
  return parts.join(", ");
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  required,
  className,
  id,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  // Keep internal query in sync if parent value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced fetch
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q
        )}&format=json&addressdetails=1&limit=6&accept-language=es`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error("network");
        const data: NominatimResult[] = await res.json();
        // Deduplicate by formatted string
        const seen = new Set<string>();
        const unique = data.filter((r) => {
          const k = formatLocation(r);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setResults(unique);
        setOpen(unique.length > 0);
        setActiveIdx(-1);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          setResults([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (r: NominatimResult) => {
    const formatted = formatLocation(r);
    skipNextFetch.current = true;
    setQuery(formatted);
    onChange(formatted);
    setOpen(false);
    setResults([]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={cn("pl-9 pr-9", className)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((r, i) => {
              const formatted = formatLocation(r);
              return (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(r);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-start gap-2 transition-colors",
                      activeIdx === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{formatted}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.display_name}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border bg-muted/30">
            Sugerencias por OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
