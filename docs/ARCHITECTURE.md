# Arquitectura. Sponsorly

> Documento descriptivo de la arquitectura del proyecto.
> Acompaña al [README](../README.md) (introducción para usuarios) y al fichero [STRUCTURE.md](STRUCTURE.md) (árbol de ficheros).
> Aquí se explica **qué tipo de arquitectura es** y **por qué** se ha tomado cada decisión.

---

## 1. Tipo de arquitectura

Sponsorly se construye combinando **tres patrones bien diferenciados**, uno por capa:

| Ámbito | Tipo de arquitectura | Cómo se manifiesta |
|---|---|---|
| Sistema | **Cliente / BaaS (Backend-as-a-Service)** | El frontend habla con Supabase, que aporta auth, base de datos, storage, realtime y Edge Functions. |
| Frontend | **Single Page Application (SPA)** sobre React Router, con organización **por tipo de fichero** y **lógica de dominio extraída a clases** | `pages/` + `components/` + `lib/` (clases helper) + `services/` (cliente HTTP) |
| API propia | **MVC con capa de servicio y repositorio** (variante moderna del MVC clásico, también conocida como **Controller–Service–Repository**), escrita en POO | Controllers → Services → Repositories dentro de la Edge Function `api` |
| Datos | **PostgreSQL relacional con Row-Level Security** | Cada tabla declara políticas; las consultas del cliente se filtran por usuario |

> En resumen: **SPA + BaaS + API REST estilo MVC + Postgres con RLS**.

### ¿Qué es MVC y por qué se le llama así aquí?

**MVC** (Model–View–Controller) es un patrón clásico de organización del código en aplicaciones que reciben peticiones del usuario:

- **Model**. los datos y las reglas que los gobiernan (qué es un evento, qué reglas debe cumplir, cómo se persiste).
- **View**. la presentación al usuario (en una API REST, "la vista" es el JSON que se devuelve; en una web tradicional, sería el HTML renderizado).
- **Controller**. recibe la petición, decide qué hacer, pide al Model lo que necesita y devuelve la View.

En su forma original (años 70–80, Smalltalk), el Model concentraba **tanto los datos como la lógica de negocio**. Con el tiempo, en aplicaciones grandes se popularizó separar dos capas auxiliares que hoy se consideran parte del MVC moderno:

- **Service layer**. extrae la lógica de negocio del Model. Los Services responden a "casos de uso" ("crear un evento", "enviar un mensaje") y orquestan validaciones, autorización fina y reglas.
- **Repository layer**. extrae la persistencia del Model. Los Repositories son el único punto que habla con la base de datos; el resto del código no sabe si por debajo hay PostgreSQL, MongoDB o un fichero JSON.

Esa variante (Controller → Service → Repository) es lo que se ve en frameworks como Spring (Java), NestJS (Node) o ASP.NET MVC, y es **exactamente** lo que hay en `supabase/functions/api/`:

| Pieza MVC | Dónde vive | Qué hace |
|---|---|---|
| **Controller** | `supabase/functions/api/controllers/` | Lee la request HTTP, parsea params/body, llama al Service, devuelve la View. |
| **Service** | `supabase/functions/api/services/` | Reglas de negocio y autorización fina ("solo organizadores crean eventos"). |
| **Repository** | `supabase/functions/api/repositories/` | Único punto de acceso a Postgres. CRUD genérico en `BaseRepository`. |
| **Model** | `EventRow`, `ProfileRow`, `MessageRow` (interfaces TS) + tablas Postgres | Estructura de los datos. La lógica vive en Service; la persistencia en Repository. |
| **View** | `ResponseFactory.json(...)` | JSON uniforme con CORS y status. |

En la literatura también se llama **"Controller–Service–Repository pattern"** o, desde la separación física en capas, **"layered architecture"**. Tres formas de nombrar lo mismo.

---

## 2. Diagrama de alto nivel

```
┌──────────────────────────────────────────────┐
│                Navegador (SPA)               │
│  React + Vite + TS + shadcn/ui + Tailwind    │
│                                              │
│  pages/  components/  contexts/  hooks/      │
│      │       │            │        │         │
│      └───────┴─────┬──────┴────────┘         │
│                    ▼                         │
│   src/lib/* (clases de dominio)              │
│   src/services/* (ApiClient + servicios)     │
│   integrations/supabase/client.ts            │
└─────────┬───────────────────────┬────────────┘
          │                       │
   (1) supabase-js                │ (2) fetch /api/...
          │                       │  (Authorization: Bearer JWT)
          ▼                       ▼
┌──────────────────────────────────────────────┐
│              Supabase / Lovable Cloud        │
│ ┌────────────┐  ┌──────────────────────────┐ │
│ │   Auth     │  │  Edge Function "api"     │ │
│ │  (JWT)     │  │  Deno + TS  (POO)        │ │
│ └─────┬──────┘  │  index → Auth → Router → │ │
│       │         │  Controllers → Services →│ │
│       │         │  Repositories            │ │
│       │         └──────────────┬───────────┘ │
│       ▼                        ▼             │
│ ┌──────────────────────────────────────────┐ │
│ │          PostgreSQL + RLS                │ │
│ │  profiles · events · conversations ·     │ │
│ │  messages · contact_requests ·           │ │
│ │  saved_events · saved_sponsors           │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │  Storage (bucket `avatars`)              │ │
│ │  Realtime (messages, conversations)      │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

Versión editable del diagrama: [`docs/architecture/system-overview.drawio`](architecture/system-overview.drawio).

---

## 3. Decisiones de diseño y por qué

> Cada decisión sigue la misma estructura: **Decisión** (qué se hizo), **Explicación** (qué significa en concreto y cómo se traduce en el repo) y **Por qué** (motivos, incluyendo familiaridad del equipo donde aplique).

### 3.1 Backend-as-a-Service (Supabase)

- **Decisión**: usar Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) como plataforma backend.
- **Explicación**: la base de datos, el sistema de login, la subida de ficheros, los canales de tiempo real y la Edge Function `api` están todos gestionados por Supabase. Operativamente, "el backend" es una cuenta en Supabase más las migraciones SQL del repo.
- **Por qué**:
  - El equipo arrancó el producto en **Lovable**, que ya integra Supabase.
  - Permite disponer de auth, DB, realtime y storage sin operar infraestructura.
  - El equipo está familiarizado con Supabase y con el ecosistema relacional Postgres.
  - Tiempo y coste para una primera versión funcional muy bajos.

### 3.2 Acceso doble a datos: cliente Supabase **y** API REST propia

- **Decisión**: el frontend habla con la base de datos de dos formas:
  1. Directamente con `@supabase/supabase-js` (mayoría de páginas).
  2. Vía `fetch` a la Edge Function `api` (`src/services/ApiClient.ts`).
- **Explicación**: muchas pantallas (Dashboard, listados, mensajes, perfil) llaman a Supabase desde el navegador como si fuera la base de datos. Algunos flujos pasan por una API REST propia desplegada como Edge Function que internamente también habla con Supabase. Ambas vías llegan al mismo Postgres y ambas están protegidas por RLS.
- **Por qué**:
  - El **acceso directo + RLS** es ágil para CRUD simple y permite iterar rápido.
  - La **API REST** aporta un punto donde aplicar **validaciones, autorización fina y reglas de negocio** (por ejemplo "solo organizadores crean eventos", validar `title.trim()`, devolver errores 400 legibles).
  - Permite aplicar el patrón MVC clásico (con el que el equipo está cómodo) en una zona acotada del proyecto.

### 3.3 Row-Level Security como mecanismo principal de autorización

- **Decisión**: cada tabla tiene RLS habilitado y políticas explícitas por operación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Explicación**: la comprobación de "este usuario puede leer / escribir esto" vive en la propia base de datos. Postgres rechaza la consulta si el usuario que la lanza no cumple la política de la tabla. El cliente Supabase manda cada petición con el JWT del usuario y la DB evalúa las políticas en función de ese token.
- **Por qué**:
  - La autorización se aplica **en el motor de datos**, garantizando coherencia tanto si la petición llega del navegador como si llega de la API.
  - Concentrar la autorización en un único lugar reduce el riesgo de inconsistencias.
  - Es el patrón canónico recomendado por Supabase y con el que está familiarizado el equipo.
- **Implementación clave**:
  - Funciones helper `get_user_role`, `get_profile_id`, `is_conversation_participant` con `SECURITY DEFINER` para evitar recursión.
  - Cliente Supabase del backend creado con el `Authorization` del usuario, de modo que **respeta las mismas políticas** que el cliente del navegador.

### 3.4 Edge Function única `api` con arquitectura MVC

- **Decisión**: una sola Edge Function (`supabase/functions/api/`) que enruta internamente a controladores. Patrón **MVC** en su variante moderna **Controller → Service → Repository** (ver § 1).
- **Explicación**: hay **una sola función `api`** que recibe todas las peticiones y un router interno simple decide qué controlador la atiende. Cada controlador delega en un service (lógica de negocio) que usa un repository (acceso a datos). El cliente Supabase autenticado se inyecta a los repositorios para que las queries respeten RLS.
- **Por qué**:
  - **Una sola función** evita multiplicar despliegues e invocaciones independientes.
  - **Capas claras** dan separación de responsabilidades, testabilidad de la lógica y reutilización de los repositorios.
  - **POO con clases base abstractas** (`BaseController`, `BaseService`, `BaseRepository`) reduce duplicación: el CRUD genérico vive en `BaseRepository`.
  - **El equipo ya está familiarizado con MVC** en su variante Service + Repository (Spring/NestJS/.NET); aplicarlo aquí abarata la curva de entrada y favorece convenciones uniformes.

### 3.5 JWT obligatorio en toda la API

- **Decisión**: `AuthMiddleware` se ejecuta antes de cualquier router y exige `Authorization: Bearer <jwt>`. La función `seed-data` se marca con `verify_jwt = false` por ser de uso interno.
- **Explicación**: cualquier petición que llega a la Edge Function `api` pasa primero por un middleware que extrae el token de la cabecera `Authorization`, verifica firma y expiración, y reconstruye el `RequestContext` con el usuario autenticado. Si la validación falla, el middleware devuelve 401 antes de llegar a ningún controlador.
- **Por qué**:
  - La autenticación se centraliza en un único punto, fácil de auditar.
  - Como bonus: el cliente Supabase del backend se construye con ese JWT, así que **todo el acceso a Postgres que haga la API también pasa por las RLS del usuario**.
  - Patrón de middleware conocido y reutilizable.
- **Implementación**: `JwtValidator` valida formato + firma + expiración con `client.auth.getClaims(token)` y construye un `SupabaseClient` con el token del usuario.

### 3.6 SPA con React Router y guards explícitos

- **Decisión**: una sola página HTML (`index.html`); todas las vistas son rutas de React Router. Dos guards: `ProtectedRoute` (requiere usuario) y `RequireProfile` (requiere usuario + perfil completado).
- **Explicación**: el navegador carga un único bundle JS y luego cambia de vista sin recargar la página. Las rutas son componentes envueltos en guards: si se entra a `/dashboard` sin sesión, redirige a `/auth`; si hay sesión pero no se ha completado el onboarding, redirige a `/onboarding`. Todas las rutas y sus guards están definidas en un único fichero ([`src/App.tsx`](../src/App.tsx)).
- **Por qué**:
  - Producto con muchas pantallas interconectadas y estado compartido (auth, chat realtime); el modelo SPA encaja directamente.
  - Guards declarativos en `App.tsx` permiten leer en un solo sitio qué rutas son públicas y cuáles no.
  - El equipo tiene experiencia con React Router y modelo SPA.

### 3.7 Organización del frontend "por tipo de fichero" + clases en `lib/`

- **Decisión**: la estructura es por categoría (`pages/`, `components/`, `hooks/`, `lib/`, `services/`, `contexts/`).
- **Explicación**: hay una sola carpeta `components/`, una `pages/`, una `hooks/`, etc. La lógica que se reutiliza desde varias páginas (match, reach, avatares, mensaje de intro) se extrae a clases en `lib/` con métodos estáticos.
- **Por qué**:
  - Encaja con el tamaño del proyecto y mantiene la jerarquía de carpetas plana y predecible.
  - Es la organización por defecto que generan plantillas de Vite/Lovable y con la que el equipo está familiarizado.
  - Las clases en `lib/` son **testeables sin React** y reusables desde cualquier página.

### 3.8 React funcional + clases solo donde aporta

- **Decisión**: componentes y páginas en React funcional con hooks; clases solo en `lib/` (utilidades de dominio) y `services/` (cliente HTTP con herencia).
- **Explicación**: la UI está escrita íntegramente con la API moderna de React (`function MyPage() { ... }` + hooks). La lógica reutilizable que vive fuera de la UI sí está organizada en clases con métodos estáticos (utilidades) o con herencia (servicios).
- **Por qué**:
  - React funcional con hooks es el **estándar actual** y el modelo en el que el equipo desarrolla habitualmente.
  - Las clases en `lib/` y `services/` dan herencia (`BaseService`), encapsulación (`ApiClient` Singleton) e identidad clara: "esto es lógica reutilizable, no UI".
  - Mismo patrón que en el backend → coherencia mental entre ambos lados.

### 3.9 shadcn/ui como sistema de componentes

- **Decisión**: shadcn/ui (componentes Radix copiados al repo en `src/components/ui/`).
- **Explicación**: shadcn/ui **copia el código fuente** de cada componente al propio repo. El componente queda en `src/components/ui/button.tsx`, se edita como cualquier otro fichero, y por debajo usa primitivas accesibles de Radix UI estilizadas con Tailwind.
- **Por qué**:
  - Los componentes son **propios del repo**, editables sin esperar a que una librería externa publique un fix.
  - Radix da accesibilidad por defecto (focus management, ARIA, navegación por teclado).
  - Tailwind + tokens HSL en `index.css` permiten cambiar el tema en un solo sitio.
  - Es la opción por defecto del ecosistema Lovable y la que mejor encaja con la familiaridad del equipo en Tailwind.

### 3.10 TanStack Query como provider raíz

- **Decisión**: `QueryClientProvider` montado en `App.tsx` para tener disponible la cache de servidor en cualquier componente.
- **Explicación**: el provider de React Query está colocado en la raíz de la app; cualquier componente puede consumir `useQuery`/`useMutation` cuando lo necesite. La carga de datos en las páginas se hace con `useEffect + supabase.from(...)` y se complementa con React Query donde aporta cache compartida o sincronización.

### 3.11 Realtime sobre `messages` y `conversations`

- **Decisión**: `ALTER PUBLICATION supabase_realtime ADD TABLE …` activa Realtime en esas dos tablas; `MessagesPage` se suscribe a `postgres_changes`.
- **Explicación**: Postgres publica los cambios (INSERT/UPDATE/DELETE) de esas dos tablas a un canal WebSocket gestionado por Supabase. Las páginas del frontend pueden suscribirse y reaccionar en vivo a cambios de la base de datos.
- **Por qué**:
  - El chat en tiempo real es funcional crítico del producto. Hacerlo con Realtime nativo evita montar un canal WebSocket propio.
  - Reutiliza algo que ya viene incluido en Supabase y conocido por el equipo.

### 3.12 Migraciones SQL versionadas

- **Decisión**: ficheros en `supabase/migrations/` con timestamp + UUID, aplicados en orden por Supabase CLI.
- **Explicación**: cualquier cambio en el esquema de la base de datos (crear tabla, añadir columna, modificar política RLS) se hace creando un nuevo fichero `.sql` con un timestamp delante del nombre. La CLI de Supabase los aplica en orden y nunca se modifican migraciones ya aplicadas; si se necesita corregir algo, se crea una nueva migración.
- **Por qué**:
  - Trazabilidad: el historial de la DB se lee como el historial del repo.
  - Reproducibilidad: cualquier entorno (local, staging, prod) se levanta con el mismo orden de migraciones.
  - Es el patrón estándar (Rails-style migrations) y el equipo está cómodo con él.

### 3.13 Validación

- **Decisión**: la validación se distribuye entre frontend, backend y base de datos, cada una en el nivel donde aporta más valor.
- **Explicación**: los formularios validan estado básico antes de enviar; el backend valida reglas de negocio en los Services (presencia de campos clave, role checks); la base de datos impone integridad estructural mediante `NOT NULL`, `UNIQUE`, FKs con `CASCADE`, enums y RLS. El detalle exhaustivo de qué valida cada capa vive en [`VALIDATION.md`](VALIDATION.md).
- **Por qué**:
  - Cada capa cubre lo que está mejor posicionada para cubrir: la UI da feedback inmediato; el backend impone reglas de dominio; la DB garantiza integridad pase lo que pase arriba.

---

## 4. Capas del frontend

### 4.1 Presentación

- **Páginas** (`src/pages/`): un componente por ruta. Hacen carga de datos y render.
- **Componentes** (`src/components/`): `DashboardLayout`, `Navbar`, `EventCard`, `SponsorCard`, `MatchBadge`, `ProtectedRoute`, `SendOfferDialog`, `LocationAutocomplete`, etc.
- **shadcn/ui** (`src/components/ui/`): primitivas Radix con estilos.

### 4.2 Estado global

- **`AuthContext`** (`src/contexts/AuthContext.tsx`) expone `user`, `profile`, `session`, `loading`, `signOut`, `setProfile`. Se alimenta del hook `useAuth`.
- **TanStack Query**: provider raíz disponible para cualquier componente.
- **Estado local**: `useState` y `useRef` por página.

### 4.3 Lógica de dominio (clases utilitarias)

`src/lib/`:

- `MatchCalculator`. algoritmo de compatibilidad evento↔sponsor (sector 30%, tipo 25%, audiencia 20%, presupuesto 25%).
- `ReachCalculator`. alcance geográfico (Local / Regional / Nacional / Internacional) usando un diccionario interno de ciudades.
- `AvatarHelper`. resuelve URL de avatar (storage propio o fallback determinista de `pravatar.cc`).
- `IntroMessageBuilder`. mensaje automático de presentación al abrir conversación.

Todas son clases con métodos **estáticos**: no se instancian, no tienen estado y son trivialmente testables. Son la capa con tests unitarios en `src/test/`.

### 4.4 Acceso a datos

- **`integrations/supabase/client.ts`**: instancia única del cliente Supabase generada por Lovable.
- **`integrations/supabase/types.ts`**: tipos generados a partir del schema.
- **`src/services/`**: capa cliente HTTP que habla con la Edge Function `api`. `ApiClient` (Singleton) inyecta el JWT; `BaseService` se hereda para `EventService`, `MessageService`, `ProfileService`.

---

## 5. Capas del backend (Edge Function `api`)

Ruta: `supabase/functions/api/`.

### 5.1 Pipeline de una request

```
Deno.serve(req)
  ├─ Si OPTIONS → ResponseFactory.preflight()
  ├─ AuthMiddleware.handle(req)
  │     └─ JwtValidator.validate(req)
  │           ├─ Comprueba header Authorization
  │           ├─ Comprueba formato Bearer
  │           ├─ Comprueba JWT (3 segmentos)
  │           ├─ supabase.auth.getClaims(token)
  │           └─ Devuelve { user, client (autenticado con JWT) }
  ├─ Router.dispatch(ctx)
  │     ├─ Quita "/api" del path
  │     ├─ Busca controller por primer segmento (events / profiles / messages)
  │     └─ controller.handle(ctx, segments)
  └─ ErrorMiddleware.handle(err) en cualquier excepción
```

### 5.2 Capas

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Core | `core/` | `JwtValidator`, `HttpException` (401/403/404/400), `ResponseFactory` (Singleton), `corsHeaders` |
| Middleware | `middleware/` | `AuthMiddleware` (JWT), `ErrorMiddleware` (excepciones → HTTP) |
| Router | `Router.ts` | `Map<resource, controller>` |
| Controllers | `controllers/` | Parsean params/body, llaman al servicio, formatean respuesta |
| Services | `services/` | Reglas de negocio + autorización fina |
| Repositories | `repositories/` | Único punto de acceso a Postgres |

### 5.3 Patrones aplicados

- **Singleton**: `ApiClient` (frontend), `ResponseFactory` (backend).
- **Template Method**: `BaseController.handle()`, `BaseRepository` CRUD genérico.
- **Inyección de dependencias por constructor**: los servicios y repositorios reciben el `RequestContext` o el cliente Supabase autenticado.
- **SOLID**: cada clase tiene una responsabilidad; añadir un endpoint = nuevo controller + service + repo + 1 línea en `Router`.

### 5.4 Errores

`HttpException` y subclases (`UnauthorizedException 401`, `ForbiddenException 403`, `NotFoundException 404`, `BadRequestException 400`). El `ErrorMiddleware` las traduce a un payload JSON `{ error, status, details? }`. Cualquier `Error` no controlado se loggea y devuelve 500.

---

## 6. Capa de datos

### 6.1 Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Usuario con rol (`organizer` / `sponsor`), nombre, avatar, descripción, tags, presupuesto, ubicación y preferencias (`preferred_sectors`, `preferred_audiences`, `preferred_event_types`, `preferred_activations`). |
| `events` | Evento de un organizador: título, descripción, tipo, fecha, ubicación + `latitude`/`longitude`, capacidad, audiencia, sector, rango de patrocinio, `published`, `media[]`, `confirmed_sponsors[]`. |
| `conversations` | Hilo único entre 1 organizador y 1 sponsor sobre un evento (`UNIQUE(event_id, organizer_id, sponsor_id)`). |
| `messages` | Mensajes de una conversación. Realtime activo. |
| `contact_requests` | Solicitud de patrocinio con estado `pending` / `accepted` / `rejected` (`UNIQUE(event_id, sponsor_id)`). |
| `saved_events` | Marcadores de eventos por perfil. |
| `saved_sponsors` | Marcadores de sponsors por perfil. |

### 6.2 Enums

- `app_role`: `organizer`, `sponsor`.
- `contact_request_status`: `pending`, `accepted`, `rejected`.

### 6.3 Funciones SQL

- `get_user_role(_user_id)`. devuelve el rol del perfil de un user.
- `get_profile_id(_user_id)`. devuelve el `profile.id` de un user.
- `is_conversation_participant(_conversation_id, _user_id)`. true si el user es organizer o sponsor de la conversación.

Todas son `STABLE SECURITY DEFINER SET search_path = public`, para que las políticas RLS las puedan usar sin recursión y sin que un usuario pueda redefinirlas en su esquema.

### 6.4 Triggers

- `update_updated_at_column()` aplicado en `profiles`, `events`, `contact_requests` antes de cada `UPDATE`.
- `handle_new_user()`: hook reservado para signup; el perfil se crea explícitamente desde el onboarding.

### 6.5 Políticas RLS resumidas

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | cualquier autenticado | el propio user (`auth.uid() = user_id`) | el propio user | — |
| `events` | publicados (sponsors u organizadores) **o** organizador dueño | organizador dueño (vía `FOR ALL`) | organizador dueño | organizador dueño |
| `conversations` | participante (`is_conversation_participant`) | participante | — | — |
| `messages` | participante | participante (y `sender_id` = su perfil) | participante | — |
| `contact_requests` | sponsor o organizador implicado | sponsor (con check de rol) | organizador implicado | — |
| `saved_events` | dueño del registro | dueño | — | dueño |
| `saved_sponsors` | dueño del registro | dueño | — | dueño |
| `storage.objects` (bucket `avatars`) | público (SELECT) | dueño (`auth.uid() = (storage.foldername(name))[1]`) | dueño | dueño |

### 6.6 Índices

`idx_profiles_user_id`, `idx_profiles_role`, `idx_events_organizer_id`, `idx_events_published`, `idx_events_date`, `idx_events_sector`, `idx_conversations_event_id`, `idx_conversations_organizer_id`, `idx_conversations_sponsor_id`, `idx_messages_conversation_id`, `idx_messages_created_at`.

### 6.7 Realtime

`ALTER PUBLICATION supabase_realtime ADD TABLE public.messages` y `public.conversations`. Cualquier `INSERT/UPDATE/DELETE` se propaga a los clientes suscritos.

### 6.8 Storage

Un único bucket público `avatars` para las fotos de perfil de los usuarios. La política RLS sobre `storage.objects` impone que cada usuario solo pueda subir, modificar y eliminar ficheros bajo el prefijo `avatars/<auth.uid()>/`. Las imágenes asociadas a eventos (`events.media`) se almacenan como URLs (externas o estáticos servidos desde `public/`), no a través de Supabase Storage.

---

## 7. Flujos transversales

### 7.1 Autenticación

```
/auth (signup) → email verification → /auth (login)
   ↓
AuthContext detecta sesión → carga profile
   ↓
Si no hay profile → /onboarding (crea profile con role + datos)
Si hay profile → /dashboard
```

Guards en `App.tsx`: `ProtectedRoute` (sesión) y `RequireProfile` (sesión + perfil).

### 7.2 Solicitud de patrocinio

```
Sponsor abre evento → SendOfferDialog
   ↓
INSERT contact_requests (status=pending)        [RLS: solo sponsors crean]
   ↓
Organizador recibe en /messages
   ↓
Acepta  → UPDATE status=accepted              [RLS: solo organizador]
        → INSERT conversations                  [RLS: participante]
        → mensaje inicial generado por IntroMessageBuilder
Rechaza → UPDATE status=rejected
```

### 7.3 Chat realtime

```
INSERT messages
   ↓
Postgres → publication supabase_realtime
   ↓
WebSocket → suscripción de MessagesPage → setState
```

### 7.4 Algoritmo de match

`MatchCalculator.calculateMatchScore(event, sponsor)`. 4 dimensiones ponderadas:

| Dimensión | Peso | Lógica |
|---|---|---|
| Sector | 30 | `sponsor.preferred_sectors` ⊇ `event.sector` |
| Tipo | 25 | `sponsor.preferred_event_types` vs `event.type` (incluye coincidencia parcial) |
| Audiencia | 20 | `sponsor.preferred_audiences` vs `event.audience` (incluye coincidencia parcial) |
| Presupuesto | 25 | Solapamiento de rangos `budget_min/max` ↔ `sponsorship_min/max` |

`getMatchBreakdown(event, sponsor, perspective)` devuelve 4 ítems con `level` (`high`/`medium`/`low`), `compatible` y `reason` localizado en español según perspectiva.

### 7.5 Reach geográfico

`ReachCalculator.computeReach(eventLocation, sponsorLocation)` clasifica en `Local` / `Regional` / `Nacional` / `Internacional` consultando un diccionario interno de ciudades. `reachMatchesFilter(reach, filter)` aplica una jerarquía inclusiva (Local cuenta como Regional, Nacional e Internacional).

---

## 8. Resumen de decisiones. tabla rápida

| Decisión | Motivo |
|---|---|
| Supabase como backend | Velocidad de arranque, auth/realtime/storage incluidos, equipo familiarizado |
| RLS en todas las tablas | Autorización centralizada en la DB |
| API REST + cliente directo (dual) | Permite reglas no expresables solo en RLS |
| Edge Function única `api` | Menos despliegues e invocaciones independientes |
| MVC con Service + Repository | Testabilidad, SOLID y patrón conocido por el equipo |
| JWT obligatorio en middleware | Centralizado y auditable |
| SPA con React Router | Estado realtime + experiencia del equipo con SPA |
| Organización por tipo de fichero | Encaja con el tamaño del proyecto y plantillas Vite/Lovable |
| shadcn/ui (Radix copiado) | Editable, accesible, themable |
| Migraciones SQL versionadas | Trazabilidad y reproducibilidad |
| Realtime nativo | Funciona out-of-the-box |

---

## 9. Documentos relacionados

- [`STRUCTURE.md`](STRUCTURE.md). árbol de ficheros comentado.
- [`architecture/system-overview.drawio`](architecture/system-overview.drawio). diagrama editable.
- [`DOCUMENTATION_PLAN.md`](DOCUMENTATION_PLAN.md). plan de qué se documenta y dónde.
- [`TESTING.md`](TESTING.md). estrategia de testing.
- [`VALIDATION.md`](VALIDATION.md). descripción de la capa de validación.
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md). versión enfocada en la API REST. Queda como referencia complementaria; este documento es la versión completa.
