# Plan — Cliente y mocks de farmacia, y el contrato real en la API (Carril Marcelo, carriles 42 y 47)

- Fecha: 2026-09-25 · Repos afectados: `alovida/mantra-core-health` (front, H2-H3, H7 parcial), `alovida/mantra-core-health-api` (API, H4-H6, H7 parcial) · Predecesor: ninguno
- Espejo del plan completo (H1-H3 detallados): `mantra-core-health/docs/trabajo/2026-09-25-farmacia-datos-y-contrato-real/PLAN.md`
- Resultado observable: la API real en `dev` sirve `GET /pharmacy/sites` (Haversine, sedes publicadas) y filtra `GET /pharmacy/products?pharmacyId`, con los mismos campos que el front y el mock.
- Kill-test: `yarn test src/modules/pharmacy` incluye un caso que pide `/pharmacy/sites?lat=-17.78` sin `lng` y recibe 400; el campo `distanceKm`/precios coincide con `pharmacy.types.ts` del front.

## Alcance
- IN: `GET /pharmacy/sites` real con Haversine · `pharmacyId` en `GET /pharmacy/products` real · OpenAPI/Postman + nota de pendientes en `docs/PENDIENTES-BACKEND.md` · specs de controlador/servicio con `EntityManager` mockeado · PR a `dev`.
- OUT: `pharmacy_inventory/**` (solo lectura, referencia de Haversine) · el modelo/DDL/seeds (`mantra-core-health-model/**`) · endpoint de carrito · `availability` (ya existe) · levantar el stack Docker sin permiso · debilitar specs.
- Ambigüedades registradas: ver plan espejo del front (Q-M1 a Q-M5); las que resuelve esta rama son Q-M2 (decimal de `distanceKm`) y Q-M4 (existencia de `requiresPrescription` en el DTO real).

## H1 — Cortes y baseline (API)
**CA/DoD:** ver plan espejo. Corte fijado: `origin/dev` = `343795cc2d08745692f491c50e81427215043315` (confirmado igual al target de la ficha).
**Estado:** HECHO

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H1.S1.M1 | Fijar corte y rama | `git rev-parse origin/dev` | HECHO |
| H1.S1.M3 | Baseline: `yarn typecheck`, `yarn test src/modules/pharmacy` | → `evidencia/antes/api/` | HECHO |
| H1.S1.M4 | Clasificar rojos previos | tabla abajo | HECHO — sin rojos previos en `pharmacy` |

## H4 — `GET /pharmacy/sites` en la API real — ALTA (BLOQUEANTE para H2 del front, que ya publicó los tipos)
**CA:** Dado `GET /pharmacy/sites?search=&lat=&lng=&limit=`, devuelve las sedes publicadas del tenant con `siteId, siteName, pharmacyId, pharmacyName, addressText, latitude, longitude, distanceKm, homeDeliveryAvailable, pickupAvailable, productCount`, ordenadas por distancia (con origen) y nombre; `lat` sin `lng` = 400; sin `@Roles`.
**DoD:** spec del controlador (≥5 casos) y del servicio; OpenAPI actualizado; `yarn typecheck` exit 0.
**Estado:** A MEDIAS — código y specs (M1-M4) HECHO; M5 (OpenAPI) BLOQUEADO por un bug preexistente ajeno a este carril

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Leer `pharmacy-read.service.ts` y `pharmacy-inventory-read.service.ts` (Haversine, validación lat/lng); anotar qué se reusa | Archivo y línea de cada pieza | `haversineKm`/`GeoPoint` reusados por import desde `pharmacy_inventory/services` (exportados, l. 423-433); `parseOrigin` de `pharmacy-inventory-read.controller.ts:103-121` es privado (no exportado) — se replicó local en `pharmacy-read.controller.ts` (mismo comportamiento, declarado en el código) | HECHO |
| H4.S1.M2 | `PharmacySiteListItemDto`/`PharmacySiteListResponseDto` en `read-responses.dto.ts` — idénticos a `PharmacySite` del front | Nombre por nombre | `evidencia/h4/campos.md` | HECHO |
| H4.S1.M3 | `listSites({ search, origin }, limit)` en el servicio | Spec del servicio | `yarn test src/modules/pharmacy/services/pharmacy-read.service.spec.ts` → 19/19 (15 nuevos de `listSites`+`requiresPrescription`) | HECHO |
| H4.S1.M4 | `@Get('sites')` antes de `sites/:siteId/prices`, `@ApiQuery`×4, `lat`+`lng` juntos o 400, sin `@Roles` | Spec del controlador (200 con origen, 200 sin origen, 400 lat solo, filtro search, limit) | `yarn test src/modules/pharmacy/controllers/pharmacy-read.controller.spec.ts` → 7/7 (6 casos de `listSites`, ≥5 pedidos) | HECHO |
| H4.S1.M5 | OpenAPI regenerado, `docs:coverage` en verde | Sin diff pendiente | **BLOQUEADO** — `yarn docs:openapi:generate` no puede bootstrapear la app: `UnknownDependenciesException` en `PractitionerSettlementBatchesService` de `InsuranceModule`, módulo ajeno a este carril, no tocado. Preexistente en `origin/dev`. `evidencia/h4/openapi-bloqueado.txt` |

## H5 — `pharmacyId` en `GET /pharmacy/products` — ALTA
**CA:** Dado `GET /pharmacy/products?pharmacyId=<uuid>`, sólo vuelven productos publicados de esa farmacia; `pharmacyId` no-uuid = 400; sin el parámetro, igual que hoy.
**Estado:** A MEDIAS — M1-M2 HECHO; M3 (OpenAPI) BLOQUEADO por el mismo bug preexistente que H4.S1.M5

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H5.S1.M1 | `ParseUUIDPipe({ optional: true })` + `@ApiQuery` | 400 no-uuid es garantía del pipe de Nest (no unit-testeable llamando al método directo, igual que `conceptId` ya existente); spec fija que el controlador reenvía el valor al servicio | HECHO |
| H5.S1.M2 | Filtro en el servicio — **intersección**, no reemplazo, del `pharmacyId` pedido con las farmacias visibles del tenant (seguridad: uno ajeno no filtra nada) | `pharmacy-read.repository.spec.ts` (nuevo) → 3/3 | HECHO |
| H5.S1.M3 | OpenAPI regenerado | `yarn docs:coverage` | **BLOQUEADO** — mismo bug de H4.S1.M5 |

## H6 — Contrato cerrado
**CA:** `postman:generate` y OpenAPI sin diff; `PENDIENTES-BACKEND.md` con la nota; PR a `dev` mergeable.
**Estado:** A MEDIAS — M2 (nota) HECHO; M1 (postman, depende del mismo bootstrap roto) y M3 (PR, bloqueado por el `push` del harness) sin cerrar

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H6.S1.M1 | `yarn postman:generate && git diff --exit-code` | Sin diff | **BLOQUEADO** — mismo bug de H4.S1.M5 (el generador de Postman también necesita bootstrapear la app) |
| H6.S1.M2 | Nota en `docs/PENDIENTES-BACKEND.md` | lectura | HECHO |
| H6.S1.M3 | PR a `dev` mergeable | `gh pr view --json mergeable` | **A MEDIAS** — commits locales listos (ver REPORTE.md); `git push` bloqueado por el clasificador de auto-modo de la sesión |

## H7 — Regresión y cierre (parte API)
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H7.S1.M2 | `yarn typecheck`, `yarn lint --max-warnings=0`, `yarn test src/modules/pharmacy` sin rojos nuevos | `typecheck` exit 0 · `lint --max-warnings=0` exit 0 (tras `--fix` de formato) · `test` → 18 suites/196 tests PASS | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| CI self-hosted apagado | H6 no demuestra checks verdes en `gh` | Se corre todo local, se pega, H6 queda `A MEDIAS` con la causa (Q-M5) |
| Campo del DTO nombrado distinto al del front | Rompe el contrato de Justin/Itzan | Diff campo por campo en `evidencia/h4/campos.md` contra `pharmacy.types.ts` publicado en H2 |
