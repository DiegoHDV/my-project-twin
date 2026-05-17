# 🎯 Sponsorly

**El punto de encuentro entre eventos y marcas.**

Sponsorly es una plataforma web que conecta organizadores de eventos con sponsors y marcas. A través de un algoritmo de match inteligente, chat en tiempo real y herramientas de gestión, facilita el proceso de encontrar el patrocinio ideal para cada evento.

🌐 **URL**: [sponsor-spot.lovable.app](https://sponsor-spot.lovable.app)

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Backend (API + Base de datos)](#-backend-api--base-de-datos)
- [Diseño orientado a clases](#-diseño-orientado-a-clases)
- [Tech Stack](#-tech-stack)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Base de datos](#-base-de-datos)
- [Sistema de autenticación](#-sistema-de-autenticación)
- [Algoritmo de Match](#-algoritmo-de-match)
- [Rutas de la aplicación](#-rutas-de-la-aplicación)
- [Flujos principales](#-flujos-principales)
- [Diseño y tema](#-diseño-y-tema)
- [Desarrollo local](#-desarrollo-local)
- [Scripts disponibles](#-scripts-disponibles)

---

## ✨ Características

### Para Organizadores de Eventos
- **Explorar sponsors**: Buscar marcas por industria, presupuesto y compatibilidad
- **Crear eventos**: Formulario completo con ubicación, audiencia, capacidad y rango de patrocinio
- **Match inteligente**: Ver porcentaje de compatibilidad con cada sponsor
- **Solicitudes de contacto**: Enviar propuestas de patrocinio a sponsors
- **Chat directo**: Conversaciones en tiempo real vinculadas a eventos específicos
- **Guardar sponsors**: Lista de sponsors favoritos para futuras colaboraciones
- **Mapa de eventos**: Visualización geográfica de todos los eventos

### Para Sponsors y Marcas
- **Explorar eventos**: Dashboard con filtros por categoría, tamaño, audiencia y presupuesto
- **Match inteligente**: Algoritmo que calcula compatibilidad basada en sector, tipo, audiencia y presupuesto
- **Desglose del match**: Explicación detallada de por qué un evento es (o no) compatible
- **Guardar eventos**: Marcar eventos de interés para revisarlos después
- **Chat directo**: Comunicación directa con organizadores
- **Perfil personalizable**: Industria, presupuesto, tipos de evento preferidos, audiencias objetivo

### Funcionalidades Compartidas
- **Autenticación segura**: Registro con verificación de email
- **Onboarding guiado**: Configuración inicial del perfil paso a paso
- **Perfiles verificados**: Información real y verificable
- **Ordenación por match**: Las tarjetas se pueden ordenar por compatibilidad, nombre o presupuesto
- **Diseño responsive**: Optimizado para desktop y móvil
- **Notificaciones toast**: Feedback visual en cada acción

---

## 🏗 Arquitectura

La aplicación sigue una arquitectura **client-side SPA** con backend serverless:

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         React + Vite + TypeScript            │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages   │  │Components│  │  Contexts  │  │
│  │          │  │          │  │  (Auth)    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │        │
│  ┌────┴──────────────┴──────────────┴─────┐  │
│  │        Capa de clases (lib/ + services/)│  │
│  │  MatchCalculator · ReachCalculator      │  │
│  │  AvatarHelper · IntroMessageBuilder     │  │
│  │  ApiClient (Singleton) · BaseService    │  │
│  └────────────────┬───────────────────────┘  │
│                   │                           │
│  ┌────────────────┴───────────────────────┐  │
│  │        Supabase Client SDK             │  │
│  └────────────────┬───────────────────────┘  │
└───────────────────┼──────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │    Lovable Cloud      │
        │  ┌─────────────────┐  │
        │  │   PostgreSQL    │  │
        │  │   (Database)    │  │
        │  ├─────────────────┤  │
        │  │   Auth (JWT)    │  │
        │  ├─────────────────┤  │
        │  │   Storage       │  │
        │  ├─────────────────┤  │
        │  │  Edge Functions │  │
        │  ├─────────────────┤  │
        │  │   Realtime      │  │
        │  └─────────────────┘  │
        └───────────────────────┘
```

---

## 🛰 Backend (API + Base de datos)

Sponsorly **no tiene servidor propio**: todo el backend vive en **Lovable Cloud / Supabase**. Hay dos vías de acceso desde el cliente:

1. **Cliente Supabase** (`@supabase/supabase-js`) directo desde el frontend, contra la base de datos PostgreSQL. La seguridad la imponen **políticas RLS** por tabla.
2. **API REST propia** desplegada como **Edge Function** (`supabase/functions/api/`), escrita en **Deno + TypeScript** con arquitectura **MVC** (Controller → Service → Repository) en POO y **JWT obligatorio** en todos los endpoints.

Ambos caminos coexisten: la mayoría de páginas usan el cliente Supabase con RLS, y la API se usa para flujos donde queremos lógica de negocio explícita o reutilizable (ver `/api-demo`).

### Stack del backend

| Capa | Tecnología |
|------|-----------|
| Runtime API | Supabase Edge Functions (Deno) |
| Base de datos | PostgreSQL gestionado por Supabase |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage (bucket `avatars`) |
| Realtime | Supabase Realtime sobre tablas `messages` y `conversations` |
| Migraciones | SQL versionado en `supabase/migrations/` |

### Arquitectura de la Edge Function `api`

```
Request
  ├─ CORS preflight (OPTIONS)
  ├─ AuthMiddleware ──► JwtValidator ──► RequestContext { user, supabase, url, req }
  ├─ Router ──► Controller ──► Service ──► Repository ──► PostgreSQL (RLS)
  └─ ErrorMiddleware ──► respuesta JSON uniforme
```

- **Controllers** (`controllers/`): parsean params/body y delegan en servicios.
- **Services** (`services/`): reglas de negocio y autorización fina (p. ej. "solo organizadores crean eventos").
- **Repositories** (`repositories/`): único punto de acceso a Postgres. Heredan CRUD genérico de `BaseRepository`.
- **Middlewares** (`middleware/`): JWT (`AuthMiddleware`) y traducción de excepciones (`ErrorMiddleware`).
- **Core** (`core/`): `JwtValidator`, `HttpException` y subclases (401/403/404/400), `ResponseFactory` (Singleton) y `corsHeaders`.

El cliente Supabase se construye **con el JWT del usuario**, por lo que las consultas siguen respetando las políticas RLS de cada tabla.

### Endpoints disponibles

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/events` | JWT | Lista eventos publicados |
| `GET` | `/api/events/:id` | JWT | Detalle de un evento |
| `POST` | `/api/events` | JWT (rol `organizer`) | Crea un evento |
| `GET` | `/api/profiles/me` | JWT | Perfil del usuario autenticado |
| `GET` | `/api/profiles` | JWT | Lista de sponsors |
| `GET` | `/api/messages?conversationId=…` | JWT | Mensajes de una conversación |
| `POST` | `/api/messages` | JWT | Envía un mensaje |

Errores estándar (401 / 403 / 404 / 400 / 500) se devuelven como `{ error, status, details? }`.

### Tablas y enums

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios con rol y preferencias (organizer / sponsor) |
| `events` | Eventos creados por organizadores (incluye `latitude`/`longitude` y `published`) |
| `conversations` | Hilos de chat ligados a un evento entre 1 organizador y 1 sponsor |
| `messages` | Mensajes de una conversación (Realtime activo) |
| `contact_requests` | Solicitudes de patrocinio con estado `pending` / `accepted` / `rejected` |
| `saved_events` | Marcadores de eventos por perfil |
| `saved_sponsors` | Marcadores de sponsors por perfil |

Enums: `app_role` (`organizer` / `sponsor`), `contact_request_status` (`pending` / `accepted` / `rejected`).

### Funciones SQL y triggers

- `get_user_role(user_id)`, `get_profile_id(user_id)`, `is_conversation_participant(conv_id, user_id)` — `SECURITY DEFINER`, usadas por las políticas RLS para evitar recursión.
- `update_updated_at_column()` — trigger genérico de timestamp en `profiles`, `events` y `contact_requests`.
- `handle_new_user()` — placeholder; el perfil se crea en el onboarding, no automáticamente.

### Storage

Bucket público `avatars`. Cada usuario solo puede subir/modificar/eliminar archivos bajo el prefijo `avatars/<auth.uid()>/`.

### Realtime

`messages` y `conversations` están añadidas a la publicación `supabase_realtime`. La página `MessagesPage` se suscribe a `postgres_changes` para chat en vivo.

### Documentación de detalle

Para tipos de arquitectura, decisiones tomadas, ER, RLS detalladas, plan de tests, validación y árbol de ficheros, ver el directorio [`docs/`](docs/).

---

## 🧩 Diseño orientado a clases

El proyecto aplica **Programación Orientada a Objetos** en toda la lógica de negocio y la capa de infraestructura. La UI (componentes y páginas de React) sigue el estándar funcional de React, mientras que la lógica de dominio y acceso a datos está íntegramente encapsulada en clases.

### Jerarquía de clases

```
                        ┌─────────────────┐
                        │   ApiClient     │  ← Singleton
                        │  (infraestr.)   │
                        └────────┬────────┘
                                 │ usa
                        ┌────────┴────────┐
                        │  BaseService    │  ← Clase abstracta
                        │   (abstract)    │
                        └────────┬────────┘
                                 │ hereda
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
  ┌───────┴──────┐     ┌─────────┴──────┐    ┌──────────┴─────┐
  │ EventService │     │ MessageService │    │ ProfileService │
  └──────────────┘     └────────────────┘    └────────────────┘

  Utilidades de dominio (métodos estáticos):

  ┌─────────────────┐   ┌──────────────────┐
  │ MatchCalculator │   │ ReachCalculator  │
  │ ─────────────── │   │ ──────────────── │
  │ calculateMatch  │   │ computeReach()   │
  │ Score()         │   │ reachMatches     │
  │ getMatch        │   │ Filter()         │
  │ Breakdown()     │   └──────────────────┘
  └─────────────────┘
  ┌─────────────────┐   ┌──────────────────────┐
  │  AvatarHelper   │   │  IntroMessageBuilder │
  │ ─────────────── │   │ ──────────────────── │
  │ getDefaultAvatar│   │ build()              │
  │ resolveAvatar() │   └──────────────────────┘
  └─────────────────┘
```

### Descripción de cada clase

#### `ApiClient` — `src/services/ApiClient.ts`
Cliente HTTP con patrón **Singleton**. Gestiona la comunicación con las Edge Functions de Supabase inyectando automáticamente el JWT del usuario en cada petición. Solo existe una instancia en toda la aplicación.

```ts
const client = ApiClient.getInstance();
await client.get<Event[]>("/events");
```

#### `BaseService` — `src/services/BaseService.ts`
**Clase abstracta** que actúa como base de todos los servicios. Recibe el `ApiClient` por inyección de dependencias en el constructor, evitando que cada servicio gestione su propia instancia.

```ts
export abstract class BaseService {
  protected readonly api: ApiClient;
  constructor(api: ApiClient = ApiClient.getInstance()) {
    this.api = api;
  }
}
```

#### `EventService` / `MessageService` / `ProfileService` — `src/services/`
Servicios de dominio que **heredan de `BaseService`**. Cada uno expone métodos de negocio específicos para su entidad, usando `this.api` heredado para las llamadas HTTP.

#### `MatchCalculator` — `src/lib/supabase-helpers.ts`
Encapsula el algoritmo de compatibilidad entre eventos y sponsors. Todos sus métodos son **estáticos**, sin necesidad de instanciar la clase.

```ts
const score = MatchCalculator.calculateMatchScore(event, sponsor);
const breakdown = MatchCalculator.getMatchBreakdown(event, sponsor, "sponsor");
```

#### `ReachCalculator` — `src/lib/reach.ts`
Calcula el alcance geográfico de un evento respecto a la localización del sponsor (Local / Regional / Nacional / Internacional), usando un diccionario interno de ciudades de España e internacionales.

```ts
const reach = ReachCalculator.computeReach(event.location, sponsor.location);
const matches = ReachCalculator.reachMatchesFilter(reach, "Regional");
```

#### `AvatarHelper` — `src/lib/avatar.ts`
Resuelve la URL del avatar de un perfil, determinando si usar la imagen subida por el usuario o generar una foto determinista con `pravatar.cc` en función del ID del perfil.

```ts
const url = AvatarHelper.resolveAvatar(profile.avatar_url, profile.id);
```

#### `IntroMessageBuilder` — `src/lib/intro-message.ts`
Construye el mensaje de presentación automático que se envía al iniciar una conversación, personalizando el texto según la perspectiva (sponsor u organizador) y las razones de compatibilidad del match.

```ts
const msg = IntroMessageBuilder.build(event, sponsor, "sponsor");
```

---

## 🛠 Tech Stack

| Capa | Tecnología | Propósito |
|------|-----------|-----------| 
| **Framework** | React 18 | Librería UI |
| **Lenguaje** | TypeScript | Type safety |
| **Bundler** | Vite 5 | Build tool rápido |
| **Estilos** | Tailwind CSS 3 | Utility-first CSS |
| **Componentes** | shadcn/ui (Radix) | Sistema de componentes accesibles |
| **Estado servidor** | TanStack React Query | Cache y sincronización |
| **Routing** | React Router v6 | Navegación SPA |
| **Formularios** | React Hook Form + Zod | Validación de formularios |
| **Mapas** | Leaflet + React Leaflet | Mapas interactivos |
| **Gráficos** | Recharts | Visualización de datos |
| **Backend** | Lovable Cloud | DB, Auth, Storage, Edge Functions |
| **Testing** | Vitest + Playwright | Tests unitarios y E2E |
| **Tipografía** | DM Sans | Fuente principal |

---

## 📁 Estructura del proyecto

```
src/
├── assets/                  # Imágenes y recursos estáticos
│
├── components/              # Componentes React reutilizables
│   ├── ui/                  # Componentes base shadcn/ui (~40 componentes)
│   ├── DashboardLayout.tsx  # Layout principal con Navbar
│   ├── EventCard.tsx        # Tarjeta de evento con match score
│   ├── SponsorCard.tsx      # Tarjeta de sponsor con match score
│   ├── MatchBadge.tsx       # Badge visual de compatibilidad
│   ├── Navbar.tsx           # Barra de navegación principal
│   ├── ProtectedRoute.tsx   # Guards de autenticación y perfil
│   └── SendOfferDialog.tsx  # Diálogo para enviar propuesta de contacto
│
├── contexts/
│   └── AuthContext.tsx      # Provider global de autenticación
│
├── hooks/
│   ├── useAuth.ts           # Hook: user, profile, session
│   ├── use-mobile.tsx       # Detección de dispositivo móvil
│   └── use-toast.ts         # Hook para notificaciones toast
│
├── integrations/
│   └── supabase/
│       ├── client.ts        # Cliente Supabase (auto-generado)
│       └── types.ts         # Tipos de la DB (auto-generado)
│
├── lib/                     # Lógica de dominio encapsulada en clases
│   ├── supabase-helpers.ts  # Tipos + clase MatchCalculator
│   ├── reach.ts             # Clase ReachCalculator + diccionario de ciudades
│   ├── avatar.ts            # Clase AvatarHelper
│   ├── intro-message.ts     # Clase IntroMessageBuilder
│   └── utils.ts             # Utilidades generales (cn, etc.)
│
├── services/                # Capa de acceso a datos (clases con herencia)
│   ├── ApiClient.ts         # Singleton HTTP client con JWT
│   ├── BaseService.ts       # Clase abstracta base
│   ├── EventService.ts      # Operaciones sobre eventos
│   ├── MessageService.ts    # Operaciones sobre mensajes y conversaciones
│   └── ProfileService.ts    # Operaciones sobre perfiles
│
├── pages/                   # Páginas de la aplicación (React funcional)
│   ├── Index.tsx            # Landing page pública
│   ├── AuthPage.tsx         # Login / Registro
│   ├── OnboardingPage.tsx   # Configuración inicial del perfil
│   ├── DashboardPage.tsx    # Panel principal (eventos para sponsors)
│   ├── SponsorsPage.tsx     # Explorar sponsors (para organizadores)
│   ├── SponsorDetailPage.tsx
│   ├── EventDetailPage.tsx
│   ├── EventFormPage.tsx    # Crear / editar evento
│   ├── EventsMapPage.tsx    # Mapa de eventos con Leaflet
│   ├── MessagesPage.tsx     # Chat y conversaciones
│   ├── ContactRequestsPage.tsx
│   ├── SavedEventsPage.tsx
│   ├── ProfilePage.tsx
│   ├── OrganizerProfilePage.tsx
│   └── NotFound.tsx
│
└── test/
    ├── setup.ts             # Configuración de Vitest
    └── example.test.ts      # Test de ejemplo
```

---

## 🗄 Base de datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuarios (organizador o sponsor) con preferencias |
| `events` | Eventos creados por organizadores |
| `conversations` | Conversaciones vinculadas a un evento entre un organizador y un sponsor |
| `messages` | Mensajes dentro de una conversación |
| `contact_requests` | Solicitudes de contacto con estado (pending/accepted/rejected) |
| `saved_events` | Eventos guardados por sponsors |
| `saved_sponsors` | Sponsors guardados por organizadores |

### Roles de usuario

El sistema usa un enum `app_role` con dos valores:
- **`organizer`**: Crea eventos, busca sponsors, recibe solicitudes
- **`sponsor`**: Explora eventos, envía solicitudes, configura preferencias

### Funciones de base de datos

| Función | Descripción |
|---------|-------------|
| `get_profile_id(user_id)` | Obtiene el ID del perfil a partir del user_id |
| `get_user_role(user_id)` | Devuelve el rol del usuario (organizer/sponsor) |
| `is_conversation_participant(conversation_id, user_id)` | Verifica si un usuario participa en una conversación |

---

## 🔐 Sistema de autenticación

### Flujo de autenticación

```
Usuario nuevo → /auth (registro) → Verificación email → /auth (login)
                                                              ↓
                                                       /onboarding
                                                     (elegir rol + datos)
                                                              ↓
                                                        /dashboard
```

### Guards de ruta

- **`ProtectedRoute`**: Requiere usuario autenticado → redirige a `/auth`
- **`RequireProfile`**: Requiere usuario + perfil creado → redirige a `/onboarding`

### Contexto de autenticación (`AuthContext`)

Expone: `user`, `profile`, `session`, `loading`, `signOut()`, `setProfile()`

---

## 🧠 Algoritmo de Match

Implementado en la clase `MatchCalculator` (`src/lib/supabase-helpers.ts`). El score se calcula con 4 dimensiones ponderadas:

| Dimensión | Peso | Lógica |
|-----------|------|--------|
| **Sector** | 30 pts | `sponsor.preferred_sectors` vs `event.sector` |
| **Tipo de evento** | 25 pts | `sponsor.preferred_event_types` vs `event.type` (incluye coincidencia parcial) |
| **Audiencia** | 20 pts | `sponsor.preferred_audiences` vs `event.audience` (incluye coincidencia parcial) |
| **Presupuesto** | 25 pts | Solapamiento de rangos `budget_min/max` vs `sponsorship_min/max` |

**Resultado**: Porcentaje de 0 a 100.  
**Desglose**: `MatchCalculator.getMatchBreakdown()` devuelve explicación textual de cada dimensión con perspectiva organizador/sponsor.

---

## 🗺 Rutas de la aplicación

| Ruta | Componente | Acceso | Descripción |
|------|-----------|--------|-------------|
| `/` | `Index` | Público | Landing page |
| `/auth` | `AuthPage` | Público | Login y registro |
| `/onboarding` | `OnboardingPage` | Auth | Configuración inicial |
| `/dashboard` | `DashboardPage` | Auth+Perfil | Panel principal |
| `/sponsors` | `SponsorsPage` | Auth+Perfil | Explorar sponsors |
| `/sponsors/:id` | `SponsorDetailPage` | Auth+Perfil | Detalle sponsor |
| `/organizers/:id` | `OrganizerProfilePage` | Auth+Perfil | Perfil organizador |
| `/events/new` | `EventFormPage` | Auth+Perfil | Crear evento |
| `/events/:id/edit` | `EventFormPage` | Auth+Perfil | Editar evento |
| `/events/:id` | `EventDetailPage` | Auth+Perfil | Detalle evento |
| `/map` | `EventsMapPage` | Auth+Perfil | Mapa de eventos |
| `/messages` | `MessagesPage` | Auth+Perfil | Chat |
| `/saved` | `SavedEventsPage` | Auth+Perfil | Guardados |
| `/profile` | `ProfilePage` | Auth+Perfil | Mi perfil |

---

## 🔄 Flujos principales

### Sponsor → Evento
1. Sponsor explora eventos en el Dashboard
2. Ve el match score en cada tarjeta (calculado por `MatchCalculator`)
3. Entra al detalle y revisa el desglose del match
4. Guarda el evento o envía solicitud de contacto
5. Si es aceptada, se abre conversación de chat con mensaje generado por `IntroMessageBuilder`

### Organizador → Sponsor
1. Organizador explora sponsors en la página de Sponsors
2. Ordena por match score, nombre o presupuesto
3. Entra al detalle del sponsor
4. Ve la compatibilidad con cada uno de sus eventos
5. Envía solicitud de contacto (vinculada a un evento)
6. Si ya hay conversación activa, el botón lleva directo al chat

### Solicitud de contacto
```
Sponsor/Organizador envía solicitud → Estado: "pending"
                                          ↓
                    Receptor acepta ──→ Se crea conversación → Chat
                    Receptor rechaza ──→ Estado: "rejected"
```

---

## 🎨 Diseño y tema

### Paleta de colores (HSL)

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `11 89% 58%` | Naranja principal |
| `--accent` | `24 100% 60%` | Naranja cálido de acento |
| `--background` | `240 5% 96%` | Fondo general (gris claro) |
| `--card` | `0 0% 100%` | Fondo de tarjetas (blanco) |
| `--foreground` | `0 0% 13%` | Texto principal (casi negro) |
| `--muted-foreground` | `0 0% 42%` | Texto secundario |

### Gradientes custom

- **`gradient-primary`**: Gradiente 135° de primary a accent (botones, badges)
- **`gradient-chat-sent`**: Gradiente para mensajes enviados
- **`gradient-chat-active`**: Gradiente para conversación activa

### Tipografía

- **Fuente principal**: DM Sans (Google Fonts)
- **Border radius**: `0.75rem` (redondeado suave)
- **Sombras**: Sistema de 3 niveles (card, card-hover, elevated)

---

## 💻 Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# La app estará disponible en http://localhost:5173
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm run build:dev` | Build en modo development |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Linting con ESLint |
| `npm run test` | Ejecutar tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
