# Plan de documentación. Sponsorly

> Este documento es el **mapa** de la documentación del proyecto: qué documentos existen, dónde viven, qué cubre cada uno y cuándo deben actualizarse.

---

## 1. Objetivo

Tener un único sitio donde mirar para responder a:

- ¿Existe documentación sobre X?
- ¿Dónde la encuentro?
- ¿Cuándo hay que actualizarla?

---

## 2. Principios

1. **Una sola fuente de verdad por tema.** Si dos documentos cubren lo mismo, uno enlaza al otro.
2. **El README es la entrada al producto**, no a los detalles. El detalle vive en `docs/`.
3. **El código es la fuente para la *forma*; la documentación es la fuente para *intención y por qué*.**
4. **Los diagramas son editables** (`.drawio` versionado en el repo).

---

## 3. Inventario de documentos

| Documento | Ubicación | Cubre | Audiencia |
|---|---|---|---|
| Introducción al producto | [`README.md`](../README.md) | Qué es Sponsorly, features, tech stack, rutas, flujos, comandos | Cualquiera que entre al repo |
| Arquitectura del sistema | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Tipo de arquitectura, capas frontend/backend/DB, decisiones y por qué | Devs nuevos, revisores |
| Arquitectura. versión inicial | [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Versión enfocada a la API REST | Referencia complementaria |
| Estructura de ficheros | [`docs/STRUCTURE.md`](STRUCTURE.md) | Árbol de directorios comentado | Devs nuevos |
| Diagrama de alto nivel | [`docs/architecture/system-overview.drawio`](architecture/system-overview.drawio) | Visión de sistema: SPA ↔ Supabase | Devs, stakeholders no técnicos |
| Plan de tests | [`docs/TESTING.md`](TESTING.md) | Estrategia, niveles, convenciones, prioridades | Devs |
| Capa de validación | [`docs/VALIDATION.md`](VALIDATION.md) | Qué valida cada capa y cómo | Devs |
| Plan de documentación | [`docs/DOCUMENTATION_PLAN.md`](DOCUMENTATION_PLAN.md) | Este documento | Quien mantiene la doc |

---

## 4. Cuándo actualizar cada documento

| Cambio en el código | Documentos a tocar |
|---|---|
| Nueva feature visible al usuario | `README.md` (sección "Características", "Rutas") |
| Nueva ruta o página | `README.md` (tabla de rutas), `docs/STRUCTURE.md` (`pages/`) |
| Nueva carpeta o reorganización | `docs/STRUCTURE.md` |
| Nuevo endpoint en la API | `README.md` (tabla de endpoints) y `docs/ARCHITECTURE.md` si introduce capa o pattern |
| Migración SQL nueva | `docs/STRUCTURE.md` (lista de migrations) y `docs/ARCHITECTURE.md` si afecta tablas/RLS |
| Cambio de stack o tooling | `README.md` (Tech Stack) y `docs/ARCHITECTURE.md` si la decisión es relevante |
| Cambio de pattern | `docs/VALIDATION.md` o `docs/ARCHITECTURE.md` § Decisiones |
| Nuevo tipo de tests o estrategia | `docs/TESTING.md` |
| Cambio en el sistema (Supabase, providers, capas) | `docs/architecture/system-overview.drawio`, `docs/ARCHITECTURE.md` |

Regla de oro: **si la PR cambia una decisión, indica en la PR a qué documento la traslada**.

---

## 5. Convenciones de los documentos

- **Idioma**: español, salvo nombres técnicos.
- **Formato**: Markdown (CommonMark / GitHub-flavored). Tablas para datos comparables, listas para enumeraciones.
- **Diagramas**: `.drawio` editable en `docs/architecture/`. Si se añade un PNG/SVG renderizado, se pone al lado y se regenera tras cada cambio.
- **Enlaces relativos** entre documentos del repo.
- **Citas a código**: paths relativos (`src/lib/supabase-helpers.ts`) y, si vienen al caso, números de línea con dos puntos (`src/App.tsx:25`).

---

## 6. Documentos disponibles a futuro

Documentos que se pueden añadir cuando aporten valor:

- `docs/architecture/data-model.drawio`. diagrama ER de la base de datos.
- `docs/architecture/contact-request-flow.drawio`. secuencia de la solicitud de contacto.
- `docs/api/`. referencia de endpoints.
- `docs/db/RLS.md`. políticas RLS detalladas tabla por tabla.
- `docs/runbooks/`. guías operativas (deploy, rollback, restaurar DB).
- `docs/onboarding.md`. guía paso a paso para un dev nuevo.
- `docs/ADR/`. Architecture Decision Records.

---

## 7. Mantenimiento

- Revisión cada release importante: confirmar que la lista de documentos sigue alineada con el código.
- No introducir documentos sin actualizar este plan en la misma PR.
