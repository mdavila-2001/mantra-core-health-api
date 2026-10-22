# PLAN — Carril A: Farmacia, datos y contrato real (API)

> Ficha: `AlovidaPromptManager/repartos/2026-09-25/PromptNoche/Marcelo/Noche-Farmacia.DatosYContratoReal/ClienteMocksYEndpointsRealesDeFarmacia.md`
> Repo: `mantra-core-health-api` · Rama: `marcelo/feat-pharmacy-sites-y-filtro-por-farmacia-2026-09-25` · Base: `origin/dev @ 343795cc2d08745692f491c50e81427215043315`
> Plan aprobado por el usuario (turno noche 2026-09-25): `C:\Users\Usuario\.claude\plans\pasted-content-id-d35c-eres-el-hashed-sonnet.md`

## Decisiones que se apartan de la ficha (con evidencia)

1. **`GET /pharmacy/sites` y el filtro `pharmacyId` NO tocan `pharmacy_inventory/**` ni `src/common/**`** (reservados de otros): `parseOrigin`/`haversineKm` van **locales** al controlador/servicio de lectura de `pharmacy`, copiados con nota de origen desde `pharmacy_inventory/controllers/pharmacy-inventory-read.controller.ts:105-128` y `pharmacy_inventory/services/pharmacy-inventory-read.service.ts:423`.
2. **`pharmacyId` exige `@ApiQuery({ required: false, format: 'uuid' })`**: sin eso Swagger lo marca `required: true` y `check-breaking.mjs:147-158` lo bloquea como `new_required_request_field`.
3. **`docs:coverage`/`git diff --exit-code -- docs/modules` ya están rojos en `origin/dev`** por deriva ajena (6 espejos desactualizados, `data_catalog`/`qa_execution` sin página, `ops_console` sin README). Decisión del usuario: se commitea también la salida completa de `docs:modules:sync`; `ops_console` sigue rojo (exige un README que no corresponde a este carril) y se declara.
4. **Generación de OpenAPI**: se intenta local (Neon/Atlas, sin Docker) primero; si el bootstrap de Nest falla por Redis/OpenSearch/MinIO, autorizado a levantar sólo la infra de `docker-compose.yml` (sin `rebuild_stack.py`) y bajarla al terminar.
5. `postman:generate` se corre como `python tools/postman/generate_postman.py` (no hay `python3` en esta máquina).

## H1 — Baseline (API)

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H1.S1.M1 | Fijar corte y rama | `git rev-parse HEAD` | HECHO — `343795cc2d08745692f491c50e81427215043315` |
| H1.S1.M3 | Baseline: `yarn typecheck`, `yarn test src/modules/pharmacy`, `yarn lint --max-warnings=0` | Salidas en `evidencia/antes/api/` | TODO |
| — | Estado previo de la cadena de docs | `yarn docs:modules:sync && git status --short docs/modules`; `yarn docs:coverage`; revertir con `git checkout -- docs/modules` | TODO |
| H1.S1.M4 | Clasificar cada rojo previo | Tabla abajo | TODO |

### Rojos previos clasificados
(se llena tras correr H1)

## H4 — `GET /pharmacy/sites` (ALTA)

**CA (hito):** Dado `GET /pharmacy/sites?search=&lat=&lng=&limit=`, devuelve las sedes publicadas del tenant con los 11 campos de `PharmacySite` del front, ordenadas por distancia (con origen) y nombre; `lat` sin `lng` = 400; sin `@Roles`.

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H4.S1.M1 | Leer `listPharmacies`/`getPharmacy`/`resolveSiteContext` y `availability` (Haversine, `parseOrigin`) y anotar qué se reusa | archivo:línea en `evidencia/h4/` | TODO |
| H4.S1.M2 | `PharmacySiteListItemDto`/`PharmacySiteListResponseDto` + `requiresPrescription` en `PharmacySitePriceDto` | Campos idénticos al front | diff en `evidencia/h4/campos.md` | TODO |
| H4.S1.M3 | `listSites({search, origin, limit})` en el servicio, `haversineKm` local | Spec del servicio | `yarn test src/modules/pharmacy/services` | TODO |
| H4.S1.M4 | `@Get('sites')` **antes** de `sites/:siteId/prices`, `parseOrigin` local, 4 `@ApiQuery` | Spec del controlador (≥5 casos) | `yarn test src/modules/pharmacy/controllers` | TODO |
| H4.S1.M5 | `openapi/endpoints/pharmacy*.md` + README del módulo regenerados | Sin diff pendiente | `yarn docs:coverage` | TODO |

## H5 — `pharmacyId` en `GET /pharmacy/products` (ALTA)

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H5.S1.M1 | `@Query('pharmacyId', new ParseUUIDPipe({optional:true}))` + `@ApiQuery` | 400 con no-uuid (spec del pipe) | TODO |
| H5.S1.M2 | Filtro en el servicio: acota `pharmacyIds` a `[pharmacyId]` si es visible, si no vacío | Spec | TODO |
| H5.S1.M3 | OpenAPI regenerado | Sin diff pendiente | TODO |

## H6 — Contrato cerrado (ALTA)

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H6.S1.M1 | `yarn build && node tools/openapi/generate-openapi.mjs` (Docker si hace falta) → `docs:openapi:lint`, `check-breaking`, `docs:endpoints:generate`, `docs:modules:sync`, `postman:generate`, `docs:coverage`, `docs:links` | Salidas pegadas | TODO |
| H6.S1.M2 | `docs/PENDIENTES-BACKEND.md` con la nota de cierre | Existe, sin `TODO:`/`TBD` | TODO |
| H6.S1.M3 | PR a `dev` mergeable | `gh pr view --json mergeable` | TODO |

## H7 — Regresión y cierre (API)

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H7.S1.M2 | `yarn typecheck`, `yarn lint --max-warnings=0`, `yarn test src/modules/pharmacy` | Sin rojos nuevos | TODO |
| H7.S1.M3 | `REPORTE.md`; `git status` limpio; nada corriendo | — | TODO |

## Alcance

**IN:** `pharmacy-read.controller.ts`, `pharmacy-read.service.ts`, `read-responses.dto.ts`, sus specs, `openapi/endpoints/pharmacy*.md`, `docs/PENDIENTES-BACKEND.md`, README del módulo, artefactos generados de docs.
**OUT:** `pharmacy_inventory/**` (sólo lectura), `src/common/**`, `repositories/pharmacy-read.repository.ts`, el modelo/DDL/seeds, cualquier endpoint de carrito.

## Hallazgo lateral — bloqueante de trunk destapado en H6 (2026-09-25)

`node tools/openapi/generate-openapi.mjs` sobre `origin/dev @ 343795cc` (sin ningún cambio de
farmacia) falla con `UnknownDependenciesException` al no poder resolver el primer parámetro del
constructor de `PractitionerSettlementBatchesService`. Causa raíz confirmada:
`src/modules/insurance/services/practitioner-settlement-batches.service.ts:2` declara
`import type { EntityManager } from '@mikro-orm/postgresql'` — TypeScript borra el import de solo
tipo al compilar, así que Nest no tiene con qué reflexionar el parámetro `0` del constructor. Es el
único servicio del repo que inyecta `EntityManager` por constructor con un import de tipo (las
demás ~330 apariciones de `import type { EntityManager }` son repositorios que lo reciben como
parámetro de método, no por DI).

Bloquea el arranque de **cualquier** contexto de Nest sobre `origin/dev` (`yarn start`, el
generador de OpenAPI, `test:integration`), no sólo `insurance`. Afecta al equipo entero, no sólo a
este carril.

**Corregido en un PR aislado, sin mezclarlo con farmacia:** `marcelo/fix-em-type-import-2026-09-25`
→ PR #460 a `dev` (worktree separado `../mantra-core-health-api-fix-em`, un cambio de una línea).
Verificado ahí: antes del fix, `UnknownDependenciesException`; después, mismo `.env`, `OpenAPI
generado: 1253 paths, 1364 operaciones, 1226 esquemas`. `yarn typecheck` exit 0. El PR **no se
mergeó** (bloqueado por el clasificador de auto mode: "Merge Without Review" — correcto, un merge
sin revisión humana no lo hace un agente).

**Impacto en H6 de este carril:** para generar el contrato con mis dos endpoints nuevos, apliqué el
mismo cambio de una línea **temporalmente y sin commitear** sobre esta rama de farmacia (nunca se
empuja a `origin`), generé el OpenAPI, y revertí el archivo antes de cualquier commit. La evidencia
de la generación queda en `evidencia/h6/`; el PR de farmacia **no incluye** el fix de `insurance` —
vive sólo en el PR #460.
