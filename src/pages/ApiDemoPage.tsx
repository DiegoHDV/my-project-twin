import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventService, type ApiEvent } from "@/services/EventService";
import { ProfileService, type ApiProfile } from "@/services/ProfileService";
import { toast } from "sonner";

/**
 * Página de demostración del consumo de la Edge Function `api`
 * usando la capa de servicios cliente basada en clases.
 *
 * Todas las llamadas pasan por ApiClient, que añade automáticamente
 * el JWT del usuario autenticado en el header Authorization.
 */
export default function ApiDemoPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [me, setMe] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const eventService = new EventService();
  const profileService = new ProfileService();

  const load = async () => {
    setLoading(true);
    try {
      const [evs, profile] = await Promise.all([
        eventService.list(),
        profileService.me(),
      ]);
      setEvents(evs);
      setMe(profile);
      toast.success("Datos cargados desde la API protegida con JWT");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Demo (JWT + POO)</h1>
          <p className="text-muted-foreground mt-1">
            Endpoints servidos por la Edge Function <code>api</code>, validados con JWT en cada request.
          </p>
        </div>

        <Button onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Recargar"}
        </Button>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">GET /api/profiles/me</h2>
          <pre className="text-xs overflow-auto bg-muted p-3 rounded">
            {me ? JSON.stringify(me, null, 2) : "—"}
          </pre>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">GET /api/events ({events.length})</h2>
          <ul className="space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-b py-1">
                <span className="font-medium">{e.title}</span>
                {e.location && <span className="text-muted-foreground"> — {e.location}</span>}
              </li>
            ))}
            {events.length === 0 && <li className="text-muted-foreground">Sin eventos</li>}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
