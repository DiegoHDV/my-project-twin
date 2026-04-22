# Arquitectura — API con clases y JWT

## Resumen

Se ha añadido una **API REST propia** sobre Supabase Edge Functions, escrita íntegramente con **POO** y con **validación JWT obligatoria en todos los endpoints**. En el cliente, una capa de **servicios basada en clases** consume esta API.

## Estructura

```
supabase/functions/api/
├── index.ts                       # Punto de entrada: CORS → Auth → Router → Errores
├── Router.ts                      # Despachador a controladores por recurso
├── core/
│   ├── cors.ts                    # Cabeceras CORS reutilizables
│   ├── HttpException.ts           # Jerarquía de excepciones (401/403/404/400)
│   ├── JwtValidator.ts            # Valida firma, expiración y formato del JWT
│   └── ResponseFactory.ts         # Singleton: respuestas JSON uniformes
├── middleware/
│   ├── AuthMiddleware.ts          # Aplica JwtValidator a cada request
│   └── ErrorMiddleware.ts         # Traduce excepciones a HTTP
├── controllers/
│   ├── BaseController.ts          # Contrato handle() y utilidades
│   ├── EventsController.ts
│   ├── ProfilesController.ts
│   └── MessagesController.ts
├── services/                      # Lógica de negocio
│   ├── BaseService.ts
│   ├── EventService.ts
│   ├── ProfileService.ts
│   └── MessageService.ts
└── repositories/                  # Acceso a datos (CRUD)
    ├── BaseRepository.ts
    ├── EventRepository.ts
    ├── ProfileRepository.ts
    └── MessageRepository.ts

src/services/                      # Cliente
├── ApiClient.ts                   # Singleton HTTP, inyecta JWT automáticamente
├── BaseService.ts
├── EventService.ts
├── ProfileService.ts
└── MessageService.ts
```

## Capas (separación de responsabilidades)

1. **Controllers** — reciben la request, parsean parámetros y delegan en servicios.
2. **Services** — reglas de negocio y validaciones.
3. **Repositories** — único punto de acceso a Supabase/Postgres.
4. **Middlewares** — JWT y manejo de errores, transversales a toda ruta.
5. **Core** — utilidades compartidas (excepciones, respuestas, CORS, JWT).

## Seguridad — JWT en todos los endpoints

`AuthMiddleware.handle()` se ejecuta **antes** del router. Llama a `JwtValidator.validate()`, que:

- Exige header `Authorization: Bearer <token>`.
- Comprueba formato (3 segmentos separados por `.`).
- Verifica firma y expiración con `supabase.auth.getClaims(token)`.
- Crea un `SupabaseClient` con el token del usuario, por lo que **todas las consultas respetan RLS**.

Errores estándar:
- `401 Missing Authorization header`
- `401 Authorization header must use Bearer scheme`
- `401 Malformed JWT`
- `401 Invalid or expired token`

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/events` | Lista eventos publicados |
| GET | `/api/events/:id` | Detalle de evento |
| POST | `/api/events` | Crear evento (solo organizadores) |
| GET | `/api/profiles/me` | Perfil del usuario autenticado |
| GET | `/api/profiles` | Lista de sponsors |
| GET | `/api/messages?conversationId=...` | Mensajes de una conversación |
| POST | `/api/messages` | Enviar mensaje |

## Patrones aplicados

- **Singleton** — `ResponseFactory`, `ApiClient`.
- **Template Method** — `BaseController.handle()`, `BaseRepository` CRUD.
- **Dependency Injection** — controllers/services reciben el contexto autenticado.
- **SOLID** — cada clase tiene una única responsabilidad; se puede extender (nuevos controladores) sin modificar lo existente (Router como único punto de registro).

## Cómo proteger un nuevo endpoint

```ts
// 1. Repositorio
export class FooRepository extends BaseRepository<Foo> {
  protected readonly table = "foo";
}

// 2. Servicio
export class FooService extends BaseService {
  private readonly repo = new FooRepository(this.ctx.supabase);
  list() { return this.repo.findAll(); }
}

// 3. Controlador
export class FooController extends BaseController {
  async handle(ctx) {
    return this.responses.json(await new FooService(ctx).list());
  }
}

// 4. Registrar en Router
this.routes.set("foo", new FooController());
```

El JWT se valida automáticamente: no hay forma de saltárselo.

## Cliente (frontend)

```ts
import { EventService } from "@/services/EventService";

const events = await new EventService().list();
// ApiClient añade Authorization: Bearer <jwt> y lanza si no hay sesión.
```

Demo visible en `/api-demo`.
