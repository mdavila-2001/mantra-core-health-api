# Plan — H6 API: organización, clínica extendida y contrato de calidad (BR-28/29/30)

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (este) y `mantra-core-health` (front, plan espejo) ·
  Predecesor: H1/H2 de M7 ya mergeados en `test`.
- Resultado observable: el administrador de una práctica puede listar sus solicitudes de vinculación pendientes;
  los hubs de acceso delegado y verificación de credenciales tienen al menos una lectura real; el paciente lee sus
  propias derivaciones y su cobertura; `/billing` deja de ser sólo escritura; cada petición lleva un
  `X-Request-Id` estable de punta a punta; el OpenAPI queda regenerado con todo lo anterior adentro.
- Kill-test: pedir `GET /practices/:practiceId/role-assignments` con el administrador de otra organización y
  recibir 403/404 sin filas; pedir el mismo recurso sin token y recibir 401; curl a la API viva y ver
  `X-Request-Id` en la respuesta y el mismo id en el log.

## Alcance

**IN** (mínimo defendible dado el presupuesto de la sesión — RAM compartida con H4/H5, sin runner de CI propio):
- BR-28: `GET /practices/:practiceId/role-assignments` (CV-14); `GET /delegated-permission-sets` (CV-13 parcial);
  `GET /profiles/credentials?state=` (CV-20, cola de títulos).
- BR-29: `GET /referrals/me` (paciente, CV-10); `GET /patient-coverages/me` (paciente, CV-11);
  `GET /billing/invoices`, `GET /billing/invoices/:id`, `GET /billing/patient-statements` (CV-12).
- BR-30: `genReqId` con UUID + eco en `X-Request-Id` (TX-14); regenerar `openapi/*` al final (TX-23) sobre TODO
  lo agregado en H6; lectura en lote `GET /community/posts?ids=` si no existe, para el N+1 de "Mis artículos"
  (TX-27, un caso representativo, no los cinco).

**OUT** (no se toca en esta sesión, con la razón):
- `@Roles` de endpoints existentes y `role-mapping.ts` (dueño M2, regla del encargo).
- Receta, alergia, notas clínicas, formularios y encuestas (dueño M3).
- Agenda, farmacia, cotizaciones, contabilidad (dueño M4).
- CI del front (runner self-hosted, protecciones de rama): infraestructura fuera del alcance de este sandbox;
  se documenta como BLOQUEADO con la razón exacta, no se simula un runner verde.
- Suite `cypress/e2e/real` contra SSR + nginx + `production-api` con límite de tasa: exige el artefacto de BR-01
  (otro carril) levantado con Docker adicional; con ~2 GB compartidos entre 3 agentes no se levanta un tercer
  stack completo. BLOQUEADO, documentado.
- DDL / `mantra-core-health-model`: AG-44 residuo 2 (`.puml` de `data_catalog`/`qa_execution`) es pedido a M1.
- Auth-providers (CV-13 completo), health-context (CV-13 completo), identity-authorities/policies GET,
  adjudicación/EOB/apelación de seguros (CV-11 lado aseguradora), perioperatorio (CV-23, sólo se retoca el texto
  de la sección en el front), 4 de las 5 pantallas N+1 restantes (TX-27): NO CUBIERTO, se detalla en el reporte.
- `yarn db:vendor`, merges a `test`, Coolify (dueño M1).

**Ambigüedades registradas (regla 65 — se resuelven y se sigue, no se bloquea):**
- D-BR28-1 (dos caminos de afiliación): **A** — mantener ambos, sin migrar la pantalla existente. Diff mínimo.
- D-BR28-2 (quién aprueba la asignación de práctica): **B** — se mantiene `SECURITY_ADMIN` como ya está en
  `role-assignments.controller.ts`; no se toca el `@Roles` de las escrituras existentes (regla del encargo).
  La nueva lectura hereda el mismo rol para no crear un camino de autorización nuevo sin que M2 lo revise.
- D-BR28-3 (geo): **A** — se oculta del menú de lanzamiento (front), las rutas siguen existiendo.
- BR-29 §5.1 (`/billing` en la demo): **(a)** entra con lecturas; no se abre ninguna escritura de cobro.
- BR-29 §5.2 (cobertura del paciente): **(b)** sólo lectura por el paciente en esta sesión; el alta la sigue
  haciendo `BILLING`/`FINANCE` como hoy (no se abre `POST /patient-coverages` al titular: eso es un cambio de
  `@Roles` de un endpoint existente, fuera de alcance sin decisión de producto).

## H1 — Organización: listados de administración (BR-28)

**CA:** Dado un administrador de una práctica, cuando pide sus asignaciones de rol pendientes, entonces las ve
paginadas por cursor y nunca ve las de otra organización.
**DoD:** `corepack yarn test src/modules/practice --runInBand` en verde; API viva: `GET
/practices/:id/role-assignments` responde 200 con datos reales y 403/404 cruzando de tenant.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.M1 | `GET /practices/:practiceId/role-assignments` con filtro de estado y cursor | lista sólo la práctica pedida, aislada por tenant | test unitario + integración contra Postgres real | HECHO |
| H1.M2 | `GET /delegated-permission-sets` acotado al tenant del actor | lista sólo los sets del tenant del actor | test unitario + integración | HECHO |
| H1.M3 | `GET /profiles/credentials?state=` cola de verificación de títulos | lista pendientes de `SECURITY_ADMIN` | test unitario | HECHO |

## H2 — Clínica extendida: lecturas del paciente y billing (BR-29)

**CA:** Dado un paciente, cuando pide sus propias derivaciones o su cobertura, entonces las recibe; pedidas por
otro paciente, nunca aparecen. Dada una organización con facturas, cuando factura pide `/billing/invoices`,
entonces las ve sin acción de cobro.
**DoD:** `corepack yarn test src/modules/clinical_ext src/modules/insurance src/modules/billing --runInBand`.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | `GET /referrals/me` del paciente titular | sólo las propias, 404 sin filtrar existencia ajena | test unitario + integración | HECHO |
| H2.M2 | `GET /patient-coverages/me` del paciente titular | idem | test unitario + integración | HECHO |
| H2.M3 | `GET /billing/invoices(/:id)` y `GET /billing/patient-statements` acotados al tenant | sin campo de cobro en la respuesta | test unitario | HECHO |

## H3 — Contrato de calidad (BR-30, se ejecuta al final)

**CA:** Dada una petición cualquiera, cuando llega sin `X-Request-Id`, entonces la API genera un UUID y lo repite
en el log, en `correlationId` y en la cabecera de respuesta. Dado todo lo anterior ya commiteado, cuando se
regenera el OpenAPI, entonces incluye las rutas nuevas.
**DoD:** `curl -si` contra la API viva muestra `X-Request-Id`; `node tools/openapi/generate-openapi.mjs` sin
diff pendiente después de commitear.
**Estado:** HECHO (request-id) / A MEDIAS (N+1, un caso) / BLOQUEADO (CI runner, suite real e2e)

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.M1 | `genReqId` UUID + eco `X-Request-Id` | headers y log muestran el mismo id | spec dirigido + curl contra la API viva | HECHO |
| H3.M2 | Regenerar `openapi/openapi.json` al final de H6 | incluye las rutas de H1/H2 | `git diff --stat -- openapi/` pegado | HECHO |
| H3.M3 | N+1 de "Mis artículos" (community) | 1-2 peticiones en vez de 1+N | spec `HttpTestingController` (front) | A MEDIAS — ver reporte |
| H3.M4 | CI efectivo, suite real SSR | runner corriendo, e2e verde | — | BLOQUEADO: sin runner propio en este sandbox |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| RAM compartida con H4/H5 (~2 GB) | build/test pesado puede tumbar el host | un solo proceso pesado a la vez; Postgres efímero propio en puerto 5460, se baja al terminar |
| CI/self-hosted runner fuera de este sandbox | TX-24 no se puede verificar en verde | se documenta BLOQUEADO con la causa exacta, no se simula |
| Alcance de BR-28/29 mucho mayor al presupuesto de una sesión | no todas las 6 áreas de hubs quedan cubiertas | se prioriza lo que cierra los hallazgos citados por el encargo (CV-13/14/20, ID-19, CV-10/11/12) y se lista el resto como NO CUBIERTO |
