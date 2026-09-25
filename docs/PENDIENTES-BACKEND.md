# Pendientes de backend

Notas de cierre de brechas entre lo que el front (o el equipo) necesitaba y lo que la API real
tenía, más hallazgos laterales que quedaron destapados en el camino. Una entrada por brecha, con
fecha y PR.

## 2026-09-25 — Sedes sueltas y filtro por farmacia (carril A: Farmacia, datos y contrato real)

**Cerrada.** El front (`mantra-core-health`) tenía `GET /pharmacy/sites` y el filtro `pharmacyId`
de `GET /pharmacy/products` funcionando sólo contra el mock (PR #659, 2026-09-24). La API real no
los tenía.

- `GET /pharmacy/sites?search=&lat=&lng=&limit=`: sedes publicadas del tenant, sueltas, con
  Haversine si hay origen (`lat`/`lng` van juntos o 400, mismo contrato que
  `pharmacy_inventory`/`availability`). Reusa los mismos finders que `listPharmacies`/`getPharmacy`.
- `GET /pharmacy/products?pharmacyId=`: acota a lo publicado por una sola farmacia. `pharmacyId` no
  uuid → 400 (`ParseUUIDPipe`); no visible o ajena → lista vacía, sin 404 que filtre información.
- `requiresPrescription` agregado a `PharmacySitePriceDto` (`GET /pharmacy/sites/:siteId/prices`):
  el DTO real no lo tenía; el front ya lo esperaba en su contrato congelado.

PR: `marcelo/feat-pharmacy-sites-y-filtro-por-farmacia-2026-09-25` (API) ·
`marcelo/feat-farmacia-cliente-y-mocks-2026-09-25` (front, mergeado en `mockup` como #676).

Deuda técnica destapada, no cerrada acá: `haversineKm` vive ahora **triplicado** en el repo
(`pharmacy_inventory/services/pharmacy-inventory-read.service.ts`,
`pharmacy/services/pharmacy-marketplace.service.ts`, y el nuevo
`pharmacy/services/pharmacy-read.service.ts`), los tres con la misma fórmula. Se copió a propósito
en vez de importar entre módulos reservados de distintos carriles; consolidarlo en un
`common`/`shared` compartido es trabajo de otro turno.

## 2026-09-25 — Bug de arranque en `origin/dev`: `EntityManager` no se podía inyectar (hallazgo lateral)

**No es de este carril, pero lo bloqueaba.** Al intentar generar el contrato OpenAPI local para
farmacia, `node tools/openapi/generate-openapi.mjs` moría con `UnknownDependenciesException` al
construir `PractitionerSettlementBatchesService` — no podía resolver su parámetro `0`
(`EntityManager`). Causa raíz: `src/modules/insurance/services/practitioner-settlement-batches.service.ts:2`
declara `import type { EntityManager }`, que TypeScript borra al compilar; Nest no tiene con qué
reflexionar el tipo del parámetro del constructor. Bloqueaba el arranque de **cualquier** contexto
de Nest sobre `origin/dev` (no sólo `insurance`): `yarn start`, la generación del contrato,
`test:integration`.

Corregido en un PR de una línea, aislado: **PR #460** (`marcelo/fix-em-type-import-2026-09-25`,
worktree separado, no mezclado con farmacia). Verificado: antes del fix,
`UnknownDependenciesException`; después, mismo `.env`, `OpenAPI generado: 1253 paths, 1364
operaciones, 1226 esquemas`. **No se mergeó** — el clasificador de auto mode lo bloqueó (correcto:
un merge sin revisión humana no lo hace un agente). Queda para que alguien del equipo lo revise y
mergee; hasta entonces, nadie puede regenerar el contrato OpenAPI desde `origin/dev` sin aplicar
este mismo cambio a mano o localmente.

## 2026-09-25 — Contrato OpenAPI de `origin/dev` desactualizado respecto del código real (hallazgo lateral, sin cerrar)

Al regenerar el contrato completo (con el fix de arriba aplicado localmente, sin commitear) se
detectaron divergencias entre el `openapi.json` que vive en el repo y lo que el código real
declara — probablemente porque nadie pudo correr `generate-openapi.mjs` con éxito desde que se
mergeó el PR #459 (el mismo commit que introdujo el bug de arriba):

- `docs:openapi:check-breaking` contra `origin/dev` reporta **4 cambios incompatibles sin
  aprobar**, ninguno de farmacia: `nationalId` e `issuerAdministrativeAreaConceptId` pasaron a
  requeridos en `POST /iam/users/assisted-practitioner-registration` y
  `POST /iam/auth/register-practitioner`, y el contrato commiteado no lo reflejaba. No se sabe si
  es un cambio intencional sin migrar el contrato o una regresión real del DTO — no es este carril
  quien puede juzgarlo; lo señala sin agregar una excepción a
  `tools/openapi/breaking-changes-exceptions.json` porque eso requeriría esa decisión.
- `docs:links` reporta 3 enlaces rotos, todos ajenos a farmacia: `docs/modules/data_catalog.md`,
  `docs/modules/insurance.md` y `docs/modules/qa_execution.md` apuntan a un ADR o un contrato que
  no existen en el repo (`ADR-0024-portal-admin-catalogo-de-datos.md`,
  `insurer-practitioner-settlement-batches.md`, `ADR-0025-qa-runner-en-servidor.md`).
- `docs:coverage` reporta que el módulo `ops_console` (real, en `src/modules/ops_console/`) no
  tiene `README.md` ni entrada en `docs/modules/index.md`.

Ninguno de los tres bloquea el PR de farmacia por sí solo (los 3 endpoints/módulos afectados no
son de este carril), pero si el CI de docs corre `check-breaking`/`docs:links`/`docs:coverage`
como gate bloqueante, **cualquier PR contra `dev` esta noche —no sólo el de farmacia— va a fallar
en ese paso** hasta que alguien resuelva estas tres cosas. Se documenta acá para que no se
confunda con una regresión introducida por este carril.
