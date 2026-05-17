# Capa de validación

> Documento descriptivo de la validación en Sponsorly: qué se valida, dónde y cómo.

---

## 1. Visión general

La validación se distribuye en cuatro capas, cada una en el nivel donde aporta más valor:

1. **Frontend. formularios** — feedback inmediato al usuario. Comprobaciones manuales con `useState` y, donde se usa, el wrapper `src/components/ui/form.tsx` que envuelve `react-hook-form` + `zod`.
2. **Frontend. clases de dominio** — normalización tolerante: las clases de `src/lib/` aceptan entradas con campos `null` / `undefined` y devuelven valores neutros.
3. **Backend (Edge Function `api`)** — reglas de negocio y autorización fina dentro de los Services.
4. **Base de datos** — integridad estructural: `NOT NULL`, `UNIQUE`, FKs con `CASCADE`, enums y RLS.

---

## 2. Frontend. formularios

### Dependencias instaladas

- `react-hook-form: ^7.61.1`
- `@hookform/resolvers: ^3.10.0`
- `zod: ^3.25.76`

### Cómo se usan

- [`src/components/ui/form.tsx`](../src/components/ui/form.tsx) (wrapper de shadcn) integra `react-hook-form` con `zod` para los componentes de formulario que se construyen sobre él.
- Las páginas con formularios (login, registro, onboarding, alta de evento, perfil, envío de mensaje, solicitud de contacto) usan `useState` con `event.preventDefault()` y comprobaciones explícitas antes de llamar a Supabase. Patrón típico: `if (!title.trim()) return showToast(...)`.
- Los errores se muestran al usuario con toasts (`sonner` o el `toaster` de shadcn).
- El formato de email se delega en `<input type="email">` y en Supabase Auth.

---

## 3. Frontend. clases de dominio (`src/lib/`)

Las clases de dominio normalizan entradas para que la UI nunca rompa:

- `MatchCalculator.calculateMatchScore(event, sponsor)`:
  - Si ninguna dimensión se puede comparar (`null` / arrays vacíos / sin presupuesto), devuelve `50` (neutro).
  - Cualquier dimensión que no se puede comparar simplemente no aporta puntos.
- `ReachCalculator.computeReach(eventLoc, sponsorLoc)`:
  - Devuelve `null` si cualquiera de las ubicaciones es `null`, `undefined` o `""`.
- `AvatarHelper.resolveAvatar(url, profileId)`:
  - Si la URL no apunta al storage propio, devuelve un avatar determinista de `pravatar.cc`.
- `IntroMessageBuilder.build(event, sponsor, perspective)`:
  - Construye el mensaje incluso con campos faltantes (los oculta o los rellena con texto neutro).

El propósito de esta capa es **normalizar**, no validar entrada de usuario.

---

## 4. Backend (Edge Function `api`)

Validaciones aplicadas:

| Sitio | Regla | Acción si falla |
|---|---|---|
| `core/JwtValidator.ts` | Header `Authorization` presente | `401 Missing Authorization header` |
| `core/JwtValidator.ts` | Esquema `Bearer ` | `401 Authorization header must use Bearer scheme` |
| `core/JwtValidator.ts` | JWT con 3 segmentos | `401 Malformed JWT` |
| `core/JwtValidator.ts` | `getClaims()` sin error | `401 Invalid or expired token` |
| `core/JwtValidator.ts` | `claims.sub` presente | `401 Token missing subject` |
| `services/EventService.ts` | `payload.title` no vacío tras `trim()` | `400 title is required` |
| `services/EventService.ts` | Existe perfil del usuario | `403 Profile not found` |
| `services/EventService.ts` | Rol del perfil = `organizer` | `403 Only organizers can create events` |
| `services/EventService.ts` | Evento existe en `getById` | `404 Event not found` |
| `services/MessageService.ts` | `conversationId` no vacío | `400 conversationId is required` |
| `services/MessageService.ts` | `content` no vacío tras `trim()` | `400 content is required` |
| `services/MessageService.ts` | Existe perfil del usuario | `403 Profile not found` |
| `Router.ts` | Recurso conocido (`events`/`profiles`/`messages`) | `404 Route /... not found` |
| Controllers varios | Método HTTP permitido | `400 Method X not allowed on /...` |

Los errores se traducen a respuestas JSON uniformes (`{ error, status, details? }`) por el `ErrorMiddleware`.

---

## 5. Base de datos (Postgres)

Constraints estructurales:

| Tipo | Aplicación |
|---|---|
| `NOT NULL` | `profiles.role`, `profiles.user_id`, `events.organizer_id`, `events.title`, FKs y campos `created_at`/`updated_at` en todas las tablas. |
| `UNIQUE` | `profiles.user_id`, `conversations(event_id, organizer_id, sponsor_id)`, `contact_requests(event_id, sponsor_id)`, `saved_events(profile_id, event_id)`, `saved_sponsors(profile_id, sponsor_id)`. |
| Foreign keys con `ON DELETE CASCADE` | Toda referencia a `profiles(id)`, `events(id)`, `conversations(id)`. |
| Enums | `app_role` (`organizer`/`sponsor`), `contact_request_status` (`pending`/`accepted`/`rejected`). |
| `NUMERIC(p,s)` | `profiles.rating` `NUMERIC(3,2)`. |

Sobre estos constraints estructurales se apoyan las **políticas RLS**, que son el mecanismo principal de autorización por fila (ver [`ARCHITECTURE.md` § 6.5](ARCHITECTURE.md#65-políticas-rls-resumidas)).

---

## 6. Storage

Validación delegada en políticas RLS sobre `storage.objects`:

- Para el bucket `avatars`, solo el dueño (`auth.uid()::text = (storage.foldername(name))[1]`) puede `INSERT`/`UPDATE`/`DELETE`.
- Lectura pública.

---

## 7. Mapa "qué valida cada capa"

Marca: ✓ valida.

| Regla | Frontend (form) | Frontend (lib) | Backend API | Postgres / RLS |
|---|---|---|---|---|
| Sesión / usuario autenticado | ✓ guards de ruta | n/a | ✓ JwtValidator | ✓ RLS `TO authenticated` |
| Rol = organizer al crear evento | n/a | n/a | ✓ EventService.create | ✓ RLS `events.organizer_id = get_profile_id(auth.uid())` |
| Title de evento no vacío | ✓ formulario | n/a | ✓ EventService.create | ✓ `NOT NULL` |
| Mensaje no vacío | ✓ formulario | n/a | ✓ MessageService.send | n/a |
| Sender es participante de la conversación | n/a | n/a | n/a | ✓ RLS `is_conversation_participant` |
| Solicitud única por (evento, sponsor) | n/a | n/a | n/a | ✓ `UNIQUE(event_id, sponsor_id)` |
| Solo sponsor crea contact_request | n/a | n/a | n/a | ✓ RLS |
| Solo organizador acepta/rechaza | n/a | n/a | n/a | ✓ RLS |
| Avatar bajo `avatars/<auth.uid()>/` | ✓ código de upload | n/a | n/a | ✓ RLS storage |

---

## 8. Documentos relacionados

- [`ARCHITECTURE.md`](ARCHITECTURE.md). sección 3.13 (decisión sobre validación) y sección 6 (capa de datos y RLS).
- [`STRUCTURE.md`](STRUCTURE.md). ubicación de los ficheros mencionados.
- [`TESTING.md`](TESTING.md). qué de esto se cubre con tests.
