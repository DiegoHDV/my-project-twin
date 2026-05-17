# Estructura de ficheros. Sponsorly

> Árbol de directorios del repositorio con descripción breve de cada parte.
> Fuente única para entender **qué hay en cada carpeta**. La explicación de **por qué** está organizado así vive en [`ARCHITECTURE.md`](ARCHITECTURE.md).

Convención del documento:
- `dir/` directorios.
- Las cuentas (`× N`) indican cantidad aproximada de ficheros del mismo tipo.
- Solo se listan ficheros relevantes.

---

## Raíz del repositorio

```
sponsorly/
├── README.md                      Introducción del producto + tech stack + flujos
├── ARCHITECTURE.md                Versión inicial enfocada a la API REST (referencia)
├── docs/                          Documentación viva del proyecto
├── public/                        Estáticos servidos tal cual por Vite
├── src/                           Código del frontend (SPA React)
├── supabase/                      Backend: Edge Functions + migraciones SQL + config
│
├── index.html                     HTML root del SPA (entrypoint de Vite)
├── package.json                   Dependencias y scripts npm
├── package-lock.json              Lockfile npm
├── bun.lock / bun.lockb           Lockfiles de Bun (alternativa a npm)
├── vite.config.ts                 Config Vite (alias @ → src/, plugins, dev server)
├── vitest.config.ts               Config Vitest (jsdom, setup, includes)
├── playwright.config.ts           Config Playwright (extiende lovable-agent)
├── playwright-fixture.ts          Re-export de fixtures de lovable-agent
├── tailwind.config.ts             Tema Tailwind: colores HSL, fuente DM Sans, animaciones
├── postcss.config.js              Pipeline PostCSS (tailwind + autoprefixer)
├── tsconfig.json                  Config TS raíz (referencia a app + node)
├── tsconfig.app.json              Config TS para src/ (target ES2020, jsx react-jsx)
├── tsconfig.node.json             Config TS para ficheros de Node/Vite
├── eslint.config.js               ESLint flat config (TS + React Hooks + React Refresh)
├── components.json                Config de shadcn/ui (rutas, alias, estilos)
├── .env                           Variables de entorno (URL Supabase, anon key)
├── .gitignore
├── .gitattributes
└── .git/
```

---

## `src/`. Frontend (React SPA)

```
src/
├── main.tsx                       Punto de entrada: createRoot + <App/>
├── App.tsx                        Providers globales (QueryClient, Tooltip, Auth, Toasters)
│                                  + definición de todas las rutas con guards
├── index.css                      Variables CSS (tokens HSL), base Tailwind, gradientes
├── App.css                        Estilos puntuales adicionales
├── vite-env.d.ts                  Tipos de Vite (auto)
│
├── assets/                        Imágenes estáticas (hero, previews, logo)  × ~10
│
├── components/                    Componentes React reutilizables
│   ├── ui/                        Primitivas shadcn/ui (Radix + Tailwind)   × ~40
│   │   ├── button.tsx, dialog.tsx, form.tsx, input.tsx, select.tsx, ...
│   │   └── form.tsx integra react-hook-form + zod para los formularios
│   │
│   ├── DashboardLayout.tsx        Layout con Navbar + main + footer
│   ├── Navbar.tsx                 Barra superior con links y avatar
│   ├── NavLink.tsx                Item de navegación con estado activo
│   ├── ProtectedRoute.tsx         Exporta ProtectedRoute (sesión) + RequireProfile (sesión + perfil)
│   ├── EventCard.tsx              Tarjeta de evento (match score, CTA guardar/contactar)
│   ├── SponsorCard.tsx            Tarjeta de sponsor (industria, match)
│   ├── MatchBadge.tsx             Badge visual con porcentaje de match
│   ├── SendOfferDialog.tsx        Modal para enviar contact_request
│   └── LocationAutocomplete.tsx   Autocomplete de ciudades
│
├── contexts/
│   └── AuthContext.tsx            Context de auth: user, profile, session, signOut
│
├── hooks/
│   ├── useAuth.ts                 Suscripción a onAuthStateChange + carga de profile
│   ├── use-mobile.tsx             Detección de breakpoint móvil
│   └── use-toast.ts               Hook para disparar toasts (shadcn)
│
├── integrations/
│   └── supabase/
│       ├── client.ts              Instancia única de createClient (Lovable-managed)
│       └── types.ts               Tipos de DB (autogenerados desde schema)
│
├── lib/                           Lógica de dominio en clases con métodos estáticos
│   ├── supabase-helpers.ts        Tipos compartidos + clase MatchCalculator
│   ├── reach.ts                   ReachCalculator + diccionario CITY_DB
│   ├── avatar.ts                  AvatarHelper (resolve URL / fallback pravatar)
│   ├── intro-message.ts           IntroMessageBuilder (mensaje auto al abrir chat)
│   └── utils.ts                   Util cn() para componer clases Tailwind
│
├── services/                      Cliente HTTP hacia la Edge Function `api`
│   ├── ApiClient.ts               Singleton; inyecta Authorization: Bearer <jwt>
│   ├── BaseService.ts             Clase abstracta base; recibe ApiClient por DI
│   ├── EventService.ts            Endpoints de /events
│   ├── ProfileService.ts          Endpoints de /profiles
│   └── MessageService.ts          Endpoints de /messages
│
├── pages/                         Una página = una ruta de React Router
│   ├── Index.tsx                  Landing pública con tabs sponsor/organizador
│   ├── AuthPage.tsx               Login y registro
│   ├── OnboardingPage.tsx         Selección de rol y datos iniciales del perfil
│   ├── DashboardPage.tsx          Panel principal (eventos para sponsors / sus eventos para org.)
│   ├── EventFormPage.tsx          Crear / editar evento
│   ├── EventDetailPage.tsx        Detalle de evento con desglose de match
│   ├── EventsMapPage.tsx          Mapa Leaflet con marcadores de eventos
│   ├── SponsorsPage.tsx           Listado de sponsors (para organizadores)
│   ├── SponsorDetailPage.tsx      Perfil de un sponsor
│   ├── OrganizerProfilePage.tsx   Perfil público de un organizador
│   ├── ProfilePage.tsx            Mi perfil (editar datos y avatar)
│   ├── MessagesPage.tsx           Lista de conversaciones + chat realtime
│   ├── ContactRequestsPage.tsx    Solicitudes de contacto pendientes
│   ├── SavedEventsPage.tsx        Eventos / sponsors guardados
│   ├── ApiDemoPage.tsx            Demo de las llamadas a la API REST propia
│   └── NotFound.tsx               404 catch-all
│
└── test/                          Tests unitarios (Vitest)
    ├── setup.ts                   matchMedia mock + jest-dom
    ├── fixtures.ts                mockSponsor, mockEvent, noMatchEvent
    ├── matchCalculator.test.ts    7 specs de MatchCalculator + breakdown
    ├── reachCalculator.test.ts    10 specs de ReachCalculator
    ├── avatarHelper.test.ts       8 specs de AvatarHelper
    ├── introMessageBuilder.test.ts 7 specs de IntroMessageBuilder
    └── example.test.ts            Test scaffold inicial
```

---

## `supabase/`. Backend

```
supabase/
├── config.toml                    project_id + override por función (seed-data sin JWT)
│
├── functions/
│   ├── api/                       Edge Function principal. API REST con MVC en POO
│   │   ├── index.ts               Deno.serve: CORS → Auth → Router → Errors
│   │   ├── Router.ts              Map<resource, controller> por primer segmento
│   │   │
│   │   ├── core/
│   │   │   ├── cors.ts            Headers CORS reutilizables
│   │   │   ├── HttpException.ts   HttpException + 401/403/404/400
│   │   │   ├── JwtValidator.ts    Valida Bearer / formato / firma / expiración
│   │   │   └── ResponseFactory.ts Singleton: json(), error(), preflight()
│   │   │
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.ts  Construye RequestContext con cliente autenticado
│   │   │   └── ErrorMiddleware.ts Excepciones → respuesta JSON uniforme
│   │   │
│   │   ├── controllers/
│   │   │   ├── BaseController.ts  Contrato handle() + parseJson<T>()
│   │   │   ├── EventsController.ts    GET / POST /events, GET /events/:id
│   │   │   ├── ProfilesController.ts  GET /profiles, GET /profiles/me
│   │   │   └── MessagesController.ts  GET / POST /messages
│   │   │
│   │   ├── services/
│   │   │   ├── BaseService.ts     Almacena el RequestContext
│   │   │   ├── EventService.ts    listPublished / getById / create (con role check)
│   │   │   ├── ProfileService.ts  me / listSponsors
│   │   │   └── MessageService.ts  listByConversation / send
│   │   │
│   │   └── repositories/
│   │       ├── BaseRepository.ts  CRUD genérico (findAll/findById/insert/update)
│   │       ├── EventRepository.ts findPublished / findByOrganizer
│   │       ├── ProfileRepository.ts findByUserId / findSponsors
│   │       └── MessageRepository.ts findByConversation
│   │
│   └── seed-data/
│       └── index.ts               Función auxiliar para poblar DB (verify_jwt = false)
│
└── migrations/                    SQL versionado, aplicado en orden por Supabase CLI
    ├── 20260320123523_*.sql       Inicial: profiles, events, conversations, messages,
    │                              RLS, helpers SECURITY DEFINER, triggers, realtime
    ├── 20260320165201_*.sql       contact_requests + enum + RLS
    ├── 20260320181001_*.sql       Preferencias del sponsor (sectors/audiences/event_types)
    ├── 20260321173105_*.sql       Bucket avatars + policies de storage
    ├── 20260321193024_*.sql       saved_events + RLS
    ├── 20260321195818_*.sql       saved_sponsors + RLS
    ├── 20260322110117_*.sql       Seed de imágenes Unsplash por sector
    ├── 20260421161345_*.sql       events.latitude + events.longitude
    ├── 20260421163623_*.sql       Distribución de imágenes por evento
    ├── 20260422161008_*.sql       profiles.location
    ├── 20260422165758_*.sql       Seed: evento "TechSummit Madrid 2026 — Match 100%"
    ├── 20260423132038_*.sql       Snapshot consolidado del schema
    └── 20260423133212_*.sql       Asset estático para TechSummit Madrid
```

---

## `docs/`. Documentación del proyecto

```
docs/
├── ARCHITECTURE.md                Tipo de arquitectura + decisiones + capas
├── STRUCTURE.md                   Este documento (árbol de ficheros comentado)
├── DOCUMENTATION_PLAN.md          Mapa de qué se documenta y dónde
├── TESTING.md                     Estrategia de testing
├── VALIDATION.md                  Capa de validación
└── architecture/
    └── system-overview.drawio     Diagrama editable de alto nivel del sistema
```

---

## `public/`

Estáticos copiados literalmente al build: favicon, robots.txt, imágenes referenciadas por path absoluto desde el HTML o el código.

---

## Convenciones del repo

- **Imports**: alias `@` apunta a `src/` (configurado en `vite.config.ts` y `tsconfig.app.json`).
- **Tests**: `*.test.ts` o `*.spec.ts` dentro de `src/`. Vitest + jsdom.
- **Lockfiles**: `package-lock.json` y `bun.lock` permiten instalar con npm o bun indistintamente.
- **Migraciones**: cada cambio de schema se añade como una nueva migración con timestamp.
- **Tokens de diseño**: variables HSL en `src/index.css` y mapeo en `tailwind.config.ts`.
