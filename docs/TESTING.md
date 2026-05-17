# Plan de testing. Sponsorly

> Estrategia de tests del proyecto: herramientas, niveles, convenciones y prioridades.

---

## 1. Herramientas

| Herramienta | Versión | Configuración | Uso |
|---|---|---|---|
| Vitest | 3.2.4 | [`vitest.config.ts`](../vitest.config.ts). Entorno `jsdom`, `globals: true`, setup en `src/test/setup.ts` | Tests unitarios |
| Testing Library | `@testing-library/react` 16, `@testing-library/jest-dom` 6 | Importado en `src/test/setup.ts` | Tests de componente |
| jsdom | 20 | Vía Vitest | Entorno DOM para tests |
| Playwright | 1.57 | [`playwright.config.ts`](../playwright.config.ts). Extiende `lovable-agent-playwright-config` | Tests E2E |

Scripts disponibles en `package.json`:

```bash
npm run test         # Vitest run
npm run test:watch   # Vitest watch
```

Los tests E2E con Playwright se ejecutan vía `npx playwright test`.

---

## 2. Tests existentes

Todos en `src/test/`:

| Fichero | Cubre | Specs |
|---|---|---|
| `matchCalculator.test.ts` | `MatchCalculator.calculateMatchScore` y `getMatchBreakdown` | 7 |
| `reachCalculator.test.ts` | `ReachCalculator.computeReach` y `reachMatchesFilter` | 10 |
| `avatarHelper.test.ts` | `AvatarHelper.resolveAvatar` y `getDefaultAvatar` | 8 |
| `introMessageBuilder.test.ts` | `IntroMessageBuilder.build` (perspectivas, contenido) | 7 |
| `example.test.ts` | Scaffold inicial | 1 |
| `fixtures.ts` | `mockSponsor`, `mockEvent`, `noMatchEvent` | (helper) |
| `setup.ts` | Mock de `matchMedia`, import de jest-dom | (setup) |

Cubren la totalidad de las clases de dominio en `src/lib/` (Match, Reach, Avatar, IntroMessage).

---

## 3. Pirámide de tests

```
       ┌──────────────┐
       │     E2E      │   pocos, lentos, escenarios críticos completos
       └──────────────┘
     ┌──────────────────┐
     │   Integración    │   medio: backend con DB local, contratos API
     └──────────────────┘
   ┌───────────────────────┐
   │      Unitarios        │   muchos, rápidos: lógica de dominio y utilidades
   └───────────────────────┘
```

Sponsorly aplica una pirámide **achaparrada**: pocos E2E (3–5 escenarios golden path), unos pocos de integración para el backend, y muchos unitarios. El criterio es cubrir lo que duele si falla.

---

## 4. Niveles de tests

### 4.1 Unitarios (Vitest)

**Qué cubrir**:

- Clases de dominio en `src/lib/` (Match, Reach, Avatar, IntroMessage).
- Funciones puras nuevas que se introduzcan.
- Hooks personalizados con `@testing-library/react` + `renderHook`.
- Reducers o lógica de selección de datos.

**Convención de ubicación**: junto al fichero (`Foo.ts` + `Foo.test.ts`) o en `src/test/` si son tests de varios módulos a la vez.

**Convención de nombres**: `describe("ClaseOFunción")` → `describe("método")` → `it("comportamiento esperado")`.

### 4.2 Tests de componente (Vitest + Testing Library)

**Cuándo añadirlos**:

- Componente con lógica condicional (`MatchBadge` cambia de color según `level`, `EventCard` muestra/oculta CTAs según rol y estado, `SendOfferDialog` valida y bloquea envío).
- Componentes con accesibilidad relevante (focus management de diálogos, navegación por teclado).

**Patrón**: render con `<MemoryRouter>` y mocks de `AuthContext` cuando hagan falta. Mockear `supabase` antes de testear, no llamar a la red real.

### 4.3 Tests del backend (Edge Function)

Dos niveles complementarios:

**Unitarios sobre services y controllers**:

- Importar `EventService` con un `RequestContext` mockeado (cliente Supabase falso).
- Verificar reglas como "solo organizadores crean eventos", "title vacío → 400", "id no encontrado → 404".
- No requiere DB real.

**Integración con Supabase local**:

- Levantar Supabase local con `supabase start`.
- Aplicar migraciones, ejecutar la función `api`, atacar con `fetch` real.
- Verifica RLS de verdad.

### 4.4 E2E (Playwright)

**Escenarios golden path**:

1. Registro + verificación + login + onboarding como sponsor.
2. Organizador crea un evento, lo publica, sponsor lo ve.
3. Sponsor envía solicitud de contacto, organizador la acepta, ambos ven la conversación.
4. Chat: sponsor envía mensaje, organizador lo recibe en tiempo real.
5. Edición de perfil con upload de avatar.

**Escenarios negativos a considerar**:

- Acceso a ruta protegida sin sesión → redirige a `/auth`.
- Ruta protegida con sesión pero sin perfil → redirige a `/onboarding`.
- Sponsor intenta crear un evento → bloqueado por la API.

**Ubicación**: `tests/e2e/` o `e2e/`. Configuración en `playwright.config.ts` + `playwright-fixture.ts`, ambos extendidos de `lovable-agent-playwright-config`.

**Datos de prueba**: usar la función `seed-data` para poblar y un usuario de test dedicado.

---

## 5. Prioridades sugeridas

Orden propuesto al ampliar la cobertura:

1. **Unitarios de servicios del backend** (`EventService.create` con role check, `MessageService.send` con validaciones). Bajo coste, alto valor.
2. **E2E de los 3–5 flujos golden** (registro, crear evento, solicitud aceptada, chat). Detecta regresiones de integración.
3. **Componentes con lógica condicional** (`SendOfferDialog`, `ProtectedRoute`, `EventCard`).
4. **RLS reales** con Supabase local para confirmar que las políticas se comportan como se documenta.
5. **Hooks** (`useAuth` con `renderHook` y mock de Supabase).

---

## 6. Convenciones de tests

- **Nombre del fichero**: `<sujeto>.test.ts` o `<sujeto>.test.tsx`.
- **`describe` por clase/función, `it` por comportamiento.** Texto en presente: "returns 100 when …".
- **Sin lógica en los tests**: nada de `for` que reemplace specs, nada de `if`. Cada caso es su propio `it`.
- **Fixtures compartidos en `src/test/fixtures.ts`** para evitar duplicar mock data.
- **Mocks**: preferir mocks explícitos por test antes que mocks globales.
- **Sin red real** en unitarios: ni `fetch`, ni `supabase`, ni APIs externas. Si un test necesita red, es de integración o E2E.

---

## 7. Cobertura

Criterio práctico:

- **Lógica de dominio (`src/lib/`, backend `services/`)**: cobertura alta. Es código de negocio, fácil de testear, regresiones costosas.
- **UI**: cubrir lo que tiene lógica condicional.
- **Bugs reportados**: todo bug que se arregla viene con un test que falla antes del fix.

Para medir cobertura, Vitest soporta `--coverage` con `@vitest/coverage-v8`.

---

## 8. CI

Pipeline mínimo recomendable cuando se añada:

1. `npm install` (o `bun install`).
2. `npm run lint`.
3. `npm run test` (Vitest).
4. *(Opcional)* `npx playwright test` con servicios arrancados si hay E2E.

---

## 9. Documentos relacionados

- [`ARCHITECTURE.md`](ARCHITECTURE.md). capas y patterns que estos tests verifican.
- [`STRUCTURE.md`](STRUCTURE.md). dónde está cada cosa.
- [`VALIDATION.md`](VALIDATION.md). validaciones que entran en el plan de tests.
